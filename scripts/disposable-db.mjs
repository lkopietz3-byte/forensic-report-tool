import { spawnSync } from 'node:child_process';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, lstatSync, realpathSync, renameSync } from 'node:fs';
import { resolve, join, basename, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TESTS = ['rls-isolation.test.ts','credits-integration.test.ts','reportDelete.integration.test.ts','reportSave.integration.test.ts'];
const VERSIONS = Array.from({length:16},(_,i)=>String(i+1).padStart(4,'0'));
const sha = data => createHash('sha256').update(data).digest('hex');
function requireValue(condition, message) { if (!condition) throw new Error(message); }
export function redactOutput(text, secrets=[]) {
  return secrets.filter(Boolean).reduce((s,key)=>s.replaceAll(key,'[REDACTED]'),String(text))
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[REDACTED JWT]')
    .replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g,'[REDACTED LOCAL KEY]')
    .replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[REDACTED DATABASE URL]')
    .replace(/((?:password|secret|api.?key|anon.?key|service.?role.?key)\s*[:=]\s*)[^\s]+/gi,'$1[REDACTED]');
}

export function sanitizedEnvironment(input) {
  const env = {};
  for (const key of ['PATH','TMPDIR','LANG','LC_ALL','DOCKER_HOST']) {
    if (input[key]) env[key]=input[key];
  }
  requireValue(env.DOCKER_HOST?.startsWith('unix:///'), 'Set DOCKER_HOST to the existing local Unix Docker socket; remote Docker is refused.');
  return {...env,SUPABASE_TELEMETRY_DISABLED:'1',DO_NOT_TRACK:'1',NEXT_TELEMETRY_DISABLED:'1',CI:'1',NO_COLOR:'1'};
}
export function migrationNames(names) {
  const sorted=[...names].sort();
  requireValue(sorted.length===16 && sorted.every((name,i)=>new RegExp(`^${VERSIONS[i]}_[A-Za-z0-9_-]+\\.sql$`).test(name)), 'Require exactly migrations 0001 through 0016; missing, duplicate or unexpected inputs are refused.');
  return sorted;
}
export function validateStatus(status, port) {
  const api=new URL(status.API_URL), db=new URL(status.DB_URL);
  requireValue(api.href===`http://127.0.0.1:${port}/` && !api.username && !api.password,'Unexpected local API endpoint.');
  requireValue(db.protocol==='postgresql:' && db.hostname==='127.0.0.1' && db.port===String(port+1) && db.pathname==='/postgres','Unexpected local database endpoint.');
  requireValue(typeof status.ANON_KEY==='string' && status.ANON_KEY.length>0 && typeof status.SERVICE_ROLE_KEY==='string' && status.SERVICE_ROLE_KEY.length>0,'Missing generated local credentials.');
  return status;
}
export function validateResults(report) {
  const results=report.testResults;
  requireValue(report.success===true && report.numTotalTests>0 && report.numPassedTests===report.numTotalTests && report.numFailedTests===0 && report.numPendingTests===0,'Required database gate did not pass every collected test.');
  requireValue(Array.isArray(results) && results.length===TESTS.length && new Set(results.map(r=>basename(r.name))).size===TESTS.length && results.every(r=>TESTS.includes(basename(r.name)) && r.assertionResults?.length>0 && r.assertionResults.every(a=>a.status==='passed')),'Required database suite missing, duplicated, empty or skipped.');
  requireValue(results.reduce((n,r)=>n+r.assertionResults.length,0)===report.numTotalTests,'Reported totals do not match the exercised cases.');
  return {passed:report.numPassedTests,failed:0,skipped:0,files:results.map(r=>basename(r.name))};
}
export function safeRunDirectory(repo, runDir) {
  const actualRepo=realpathSync(repo), parent=realpathSync(dirname(resolve(runDir)));
  const actual=join(parent,basename(runDir));
  requireValue(actual!==actualRepo && !actual.startsWith(actualRepo+sep) && !actual.split(sep).includes('.git'),'Run directory must be outside the repository and all .git directories.');
  return actual;
}
export function validateBindings(ports, expectedPort) {
  const bindings=Object.values(ports).flat().filter(Boolean);
  requireValue(bindings.every(b=>b.HostIp==='127.0.0.1'||b.HostIp==='::1'),'Published ports must bind only loopback.');
  if (expectedPort!==undefined) requireValue(bindings.some(b=>b.HostPort===String(expectedPort)),'Required API/database loopback port mapping is missing.');
}
export function isolatedVitestConfig(repo, runDir) {
  return `import base from ${JSON.stringify(join(repo,'vitest.config.ts'))};\nexport default {...base, root:${JSON.stringify(repo)}, envDir:false, cacheDir:${JSON.stringify(join(runDir,'vite-cache'))}};\n`;
}
export function validateNetworkOwner(value, name, owner) {
  requireValue(value.name===name && value.owner===owner,'Refuse cleanup of a network without the exact run ownership label.');
}
function sourceHashes(root) {
  const files={};
  function visit(relative) {
    for (const entry of readdirSync(join(root,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      const path=join(relative,entry.name);
      requireValue(!entry.isSymbolicLink(),'Source symlinks are refused.');
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files[path]=sha(readFileSync(join(root,path)));
    }
  }
  visit('src');
  for (const path of ['package.json','package-lock.json','vitest.config.ts']) files[path]=sha(readFileSync(join(root,path)));
  return files;
}

export function runGate({repo,runDir,port=55421}, dependencies={}) {
  repo=realpathSync(repo);runDir=safeRunDirectory(repo,runDir);
  const execute=dependencies.execute ?? spawnSync;
  const env=sanitizedEnvironment(process.env);
  requireValue(Number.isInteger(port) && port>=1024 && port<=65530,'Invalid local port.');
  requireValue(process.versions.node==='24.19.0','Use the pinned Node 24.19.0 runtime.');
  const migrations=join(repo,'supabase/migrations');
  const names=migrationNames(readdirSync(migrations));
  for (const name of names) requireValue(lstatSync(join(migrations,name)).isFile(),'Migration symlinks and directories are refused.');
  for (const name of TESTS) requireValue(lstatSync(join(repo,'src/test',name)).isFile(),'Missing required test file.');
  const projectId=`disclosed-gate-${randomUUID().replaceAll('-','').slice(0,12)}`;
  const network=`${projectId}-loopback`;
  // Exclusive directory creation prevents adopting an existing project or its volumes.
  mkdirSync(runDir,{mode:0o700});
  mkdirSync(join(runDir,'supabase/migrations'),{recursive:true,mode:0o700});
  for (const name of ['home','docker-config','cache']) mkdirSync(join(runDir,name),{mode:0o700});
  Object.assign(env,{HOME:join(runDir,'home'),DOCKER_CONFIG:join(runDir,'docker-config'),XDG_CACHE_HOME:join(runDir,'cache')});
  const networkOwner=randomUUID();
  const receipt={projectId,network,networkOwner,runDir,repo,startedAt:new Date().toISOString(),phases:[],migrationHashes:{},sourceTests:{},result:'INCOMPLETE',cleanup:'NOT_RUN',runnerSha256:sha(readFileSync(fileURLToPath(import.meta.url)))};
  const secrets=[];
  const redact=text=>redactOutput(text,secrets);
  function record() {
    writeFileSync(join(runDir,'receipt.json.tmp'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
    renameSync(join(runDir,'receipt.json.tmp'),join(runDir,'receipt.json'));
  }
  function command(phase,bin,args,{extraEnv={},sensitive=false,allowFailure=false,timeout=180000}={}) {
    const started=Date.now();
    const r=execute(bin,args,{cwd:runDir,env:{...env,...extraEnv},encoding:'utf8',timeout,maxBuffer:32*1024*1024});
    const code=r.status ?? 1;
    receipt.phases.push({phase,command:[bin,...args],exitCode:code,milliseconds:Date.now()-started});
    // Status output contains generated credentials; never save it or CLI start output.
    if (!sensitive) writeFileSync(join(runDir,`${phase}.log`),redact((r.stdout??'')+(r.stderr??'')),{mode:0o600});
    else if (code!==0) writeFileSync(join(runDir,`${phase}-failure.log`),redact(r.stderr??''),{mode:0o600});
    record();
    if (!allowFailure) requireValue(code===0,`${phase} failed (exit ${code}); ${sensitive?'credential-bearing output deliberately not logged':`see ${phase}.log`}.`);
    return r;
  }
  let networkAttempted=false,startAttempted=false,checksPassed=false;
  try {
    requireValue(command('cli-version','supabase',['--version']).stdout.trim()==='2.117.0','Use pinned Supabase CLI 2.117.0; no auto-install.');
    command('docker-available','docker',['info','--format','{{.ServerVersion}}']);
    const existing=command('collision-check','docker',['ps','-a','--filter',`name=${projectId}`,'--format','{{.Names}}']).stdout.trim();
    requireValue(!existing,'Unexpected project-name collision; do not adopt it.');
    requireValue(!command('network-collision-check','docker',['network','ls','--filter',`name=^${network}$`,'--format','{{.Name}}']).stdout.trim(),'Unexpected network-name collision.');
    for (const name of names) {
      const bytes=readFileSync(join(migrations,name));
      writeFileSync(join(runDir,'supabase/migrations',name),bytes,{mode:0o600});
      receipt.migrationHashes[name]=sha(bytes);
      requireValue(sha(readFileSync(join(runDir,'supabase/migrations',name)))===receipt.migrationHashes[name],'Copied migration differs from inspected source.');
    }
    for (const name of TESTS) receipt.sourceTests[name]=sha(readFileSync(join(repo,'src/test',name)));
    receipt.originalVitestConfigSha256=sha(readFileSync(join(repo,'vitest.config.ts')));
    receipt.appSourceHashes=sourceHashes(repo);
    const testConfig=join(runDir,'vitest.isolated.config.mjs');
    writeFileSync(testConfig,isolatedVitestConfig(repo,runDir),{mode:0o600});
    const config=`project_id = "${projectId}"
[api]
enabled = true
port = ${port}
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
[db]
port = ${port+1}
shadow_port = ${port-1}
major_version = 17
[db.seed]
enabled = false
[auth]
enabled = true
site_url = "http://127.0.0.1:3337"
[realtime]
enabled = false
[storage]
enabled = false
[studio]
enabled = false
[local_smtp]
enabled = false
[edge_runtime]
enabled = false
[analytics]
enabled = false
`;
    writeFileSync(join(runDir,'supabase/config.toml'),config,{mode:0o600});
    receipt.configSha256=sha(config);
    networkAttempted=true;
    command('network-create','docker',['network','create','--driver','bridge','--label',`studio.disclosed.gate_owner=${networkOwner}`,'--opt','com.docker.network.bridge.host_binding_ipv4=127.0.0.1',network]);
    receipt.networkCreationConfirmed=true;
    startAttempted=true;
    command('database-start','supabase',['start','--workdir',runDir,'--network-id',network,'--exclude','realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor'],{sensitive:true,timeout:300000});
    const status=validateStatus(JSON.parse(command('local-status','supabase',['status','--workdir',runDir,'-o','json'],{sensitive:true}).stdout),port);
    secrets.push(status.ANON_KEY,status.SERVICE_ROLE_KEY,new URL(status.DB_URL).password);
    const containers=command('owned-containers','docker',['ps','--filter',`name=${projectId}`,'--format','{{.Names}}']).stdout.trim().split('\n').filter(Boolean);
    requireValue(containers.includes(`supabase_db_${projectId}`) && containers.includes(`supabase_kong_${projectId}`),'Required owned database/API containers are missing.');
    receipt.containerImages=command('container-images','docker',['inspect','--format','{{.Name}} {{.Config.Image}} {{.Image}}',...containers]).stdout.trim().split('\n');
    for (const container of containers) {
      requireValue(new RegExp(`^supabase_[a-z0-9_]+_${projectId}$`).test(container),'Unexpected owned container name.');
      const ports=JSON.parse(command(`bindings-${container}`,'docker',['inspect','--format','{{json .NetworkSettings.Ports}}',container]).stdout);
      validateBindings(ports,container===`supabase_db_${projectId}`?port+1:container===`supabase_kong_${projectId}`?port:undefined);
    }
    if (process.platform==='darwin') {
      for (const p of [port,port+1]) {
        const listener=command(`host-listener-${p}`,'lsof',['-nP',`-iTCP:${p}`,'-sTCP:LISTEN']).stdout;
        requireValue(listener.includes(`127.0.0.1:${p} (LISTEN)`) && !listener.includes(`*:${p}`),'Mac VM host forwarding must bind only loopback.');
      }
    }
    const versions=command('applied-migrations','docker',['exec',`supabase_db_${projectId}`,'psql','-U','postgres','-d','postgres','-At','-c','select version from supabase_migrations.schema_migrations order by version;']).stdout.trim().split('\n');
    requireValue(JSON.stringify(versions)===JSON.stringify(VERSIONS),'Actual applied migration history differs from all sixteen source inputs.');
    receipt.appliedVersions=versions;
    const testEnv={TEST_SUPABASE_URL:status.API_URL,TEST_SUPABASE_SERVICE_ROLE_KEY:status.SERVICE_ROLE_KEY,TEST_SUPABASE_ANON_KEY:status.ANON_KEY,TEST_SUPABASE_SCHEMA_VERSION:'0016',REQUIRE_SUPABASE_INTEGRATION:'1'};
    const r=command('database-tests',process.execPath,[join(repo,'node_modules/vitest/vitest.mjs'),'run','--config',testConfig,'--maxWorkers=1','--reporter=json',...TESTS.map(n=>`src/test/${n}`)],{extraEnv:testEnv,sensitive:true,allowFailure:true,timeout:180000});
    const report=JSON.parse(r.stdout);
    receipt.testFailures=report.testResults?.flatMap(file=>
      file.assertionResults.filter(a=>a.status!=='passed').map(a=>({
        file:basename(file.name),title:a.fullName??a.title,status:a.status,
        message:redact((a.failureMessages??[]).join('\n')).slice(0,3000),
      }))
    )??[];
    receipt.tests=validateResults(report);
    requireValue(r.status===0,'Test process exited nonzero despite its report.');
    receipt.executedCases=report.testResults.flatMap(file=>file.assertionResults.map(a=>({file:basename(file.name),title:a.fullName??a.title,status:a.status})));
    for (const name of names) {
      requireValue(sha(readFileSync(join(migrations,name)))===receipt.migrationHashes[name],'Source migration changed during execution.');
      requireValue(sha(readFileSync(join(runDir,'supabase/migrations',name)))===receipt.migrationHashes[name],'Copied migration changed during execution.');
    }
    for (const name of TESTS) requireValue(sha(readFileSync(join(repo,'src/test',name)))===receipt.sourceTests[name],'Test source changed during execution.');
    requireValue(sha(readFileSync(join(repo,'vitest.config.ts')))===receipt.originalVitestConfigSha256,'Vitest config changed during execution.');
    requireValue(JSON.stringify(sourceHashes(repo))===JSON.stringify(receipt.appSourceHashes),'App source or dependency/config inputs changed during execution.');
    checksPassed=true;
    receipt.result='CHECKS_PASSED_CLEANUP_PENDING';
    record();
  } catch (error) {
    checksPassed=false;
    receipt.result='FAIL';receipt.error=redact(error.message);
  } finally {
    const cleanupErrors=[];
    const attempt=fn=>{try {fn();} catch(error) {cleanupErrors.push(redact(error.message));}};
    if (startAttempted) attempt(()=>{
      command('owned-project-stop','supabase',['stop','--project-id',projectId,'--no-backup'],{sensitive:true});
    });
    if (startAttempted) {
      // A failed CLI stop must not prevent safe cleanup attempts. Both the
      // generated project-name suffix and the CLI ownership label must agree.
      for (const kind of ['container','volume']) attempt(()=>{
        const args=kind==='container'?['ps','-a','--filter',`name=${projectId}`,'--format','{{.Names}}']:['volume','ls','--filter',`name=${projectId}`,'--format','{{.Name}}'];
        const leftovers=command(`leftover-${kind}s`,'docker',args).stdout.trim().split('\n').filter(Boolean);
        for (const name of leftovers) attempt(()=>{
          requireValue(new RegExp(`^supabase_[a-z0-9_]+_${projectId}$`).test(name),'Refuse cleanup of an unexpected resource name.');
          const format=kind==='container'?'{{index .Config.Labels "com.supabase.cli.project"}}':'{{index .Labels "com.supabase.cli.project"}}';
          const label=command(`owner-${name}`,'docker',[kind,'inspect','--format',format,name]).stdout.trim();
          requireValue(label===projectId,'Refuse cleanup without the exact CLI ownership label.');
          command(`remove-${name}`,'docker',kind==='container'?['container','rm','--force',name]:['volume','rm',name]);
        });
      });
    }
    if (networkAttempted) attempt(()=>{
        const remaining=command('network-remains','docker',['network','ls','--filter',`name=^${network}$`,'--format','{{.Name}}']).stdout.trim();
        if (remaining) {
          const format='{"name":{{json .Name}},"owner":{{json (index .Labels "studio.disclosed.gate_owner")}}}';
          const ownership=JSON.parse(command('network-owner','docker',['network','inspect','--format',format,network]).stdout);
          validateNetworkOwner(ownership,network,networkOwner);
          command('owned-network-remove','docker',['network','rm',network]);
        }
    });
    if (startAttempted) {
      attempt(()=>{
        requireValue(!command('containers-after','docker',['ps','-a','--filter',`name=${projectId}`,'--format','{{.Names}}']).stdout.trim(),'Owned containers remain after cleanup.');
      });
      attempt(()=>{
        requireValue(!command('volumes-after','docker',['volume','ls','--filter',`name=${projectId}`,'--format','{{.Name}}']).stdout.trim(),'Owned volumes remain after cleanup.');
      });
    }
    receipt.cleanup=cleanupErrors.length?'FAIL':startAttempted||networkAttempted?'PASS':'NOT_NEEDED';
    receipt.cleanupErrors=cleanupErrors;
    receipt.result=checksPassed && cleanupErrors.length===0?'PASS':'FAIL';
    receipt.finishedAt=new Date().toISOString();record();
  }
  return receipt;
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    requireValue(process.argv.length===4 || process.argv.length===5,'Usage: node disposable-db.mjs REPO NEW_RUN_DIRECTORY [API_PORT]');
    const result=runGate({repo:process.argv[2],runDir:process.argv[3],port:Number(process.argv[4]??55421)});
    console.log(JSON.stringify({result:result.result,tests:result.tests,cleanup:result.cleanup,receipt:join(result.runDir,'receipt.json'),error:result.error}));
    process.exitCode=result.result==='PASS'?0:1;
  } catch(error) { console.error(error.message);process.exitCode=1; }
}
