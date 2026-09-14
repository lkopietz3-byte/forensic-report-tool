import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, symlinkSync, realpathSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStatus, validateResults, migrationNames, sanitizedEnvironment, redactOutput, validateBindings, safeRunDirectory, isolatedVitestConfig, validateNetworkOwner, runGate, TESTS } from './disposable-db.mjs';

const status = {API_URL:'http://127.0.0.1:55421',DB_URL:'postgresql://postgres:synthetic@127.0.0.1:55422/postgres',ANON_KEY:'synthetic-anon',SERVICE_ROLE_KEY:'synthetic-service'};
test('reject remote or wrong-port endpoints before supplying test credentials', () => {
  for (const API_URL of ['https://db.example.test','http://127.0.0.1:55321','http://127.0.0.1.evil.test:55421','http://user:pass@127.0.0.1:55421','http://127.0.0.1:55421/extra']) {
    assert.throws(() => validateStatus({...status,API_URL},55421));
  }
  assert.throws(() => validateStatus({...status,DB_URL:'postgresql://postgres:synthetic@remote.example.test:55422/postgres'},55421));
  assert.throws(() => validateStatus({...status,SERVICE_ROLE_KEY:''},55421));
  assert.equal(validateStatus(status,55421).API_URL,status.API_URL);
});
test('all sixteen unique ordered migration inputs are required', () => {
  const names=Array.from({length:16},(_,i)=>`${String(i+1).padStart(4,'0')}_migration.sql`);
  assert.equal(migrationNames(names).length,16);
  for (const invalid of [names.slice(1),[...names,'0016_duplicate.sql'],[...names,'seed.sql'],names.map(n=>n.replace('0016','0017'))]) assert.throws(()=>migrationNames(invalid));
});
test('a successful exit cannot hide missing, failed, skipped or zero tests', () => {
  const names=['rls-isolation.test.ts','credits-integration.test.ts','reportDelete.integration.test.ts','reportSave.integration.test.ts'];
  const report={success:true,numTotalTests:4,numPassedTests:4,numFailedTests:0,numPendingTests:0,testResults:names.map(n=>({name:`/repo/src/test/${n}`,assertionResults:[{status:'passed'}]}))};
  assert.equal(validateResults(report).passed,4);
  for (const invalid of [{...report,numTotalTests:0},{...report,numPendingTests:1},{...report,numFailedTests:1},{...report,success:false},{...report,testResults:report.testResults.slice(1)},{...report,testResults:[...report.testResults.slice(1),report.testResults[1]]},{...report,testResults:report.testResults.map(x=>({...x,assertionResults:[]}))}]) assert.throws(()=>validateResults(invalid));
});
test('inherited hosted credentials and app settings do not reach local tools or tests', () => {
  const env=sanitizedEnvironment({PATH:'/bin',HOME:'/synthetic',DOCKER_HOST:'unix:///synthetic/docker.sock',SUPABASE_ACCESS_TOKEN:'private',ANTHROPIC_API_KEY:'private',STRIPE_SECRET_KEY:'private',TEST_SUPABASE_URL:'https://live.example.test',NODE_OPTIONS:'--require unwanted',NEXT_PUBLIC_SUPABASE_URL:'https://live.example.test'});
  assert.equal(env.DOCKER_HOST,'unix:///synthetic/docker.sock');
  for (const key of ['HOME','DOCKER_CONFIG','SUPABASE_ACCESS_TOKEN','ANTHROPIC_API_KEY','STRIPE_SECRET_KEY','TEST_SUPABASE_URL','NODE_OPTIONS','NEXT_PUBLIC_SUPABASE_URL']) assert.equal(env[key],undefined);
  assert.throws(()=>sanitizedEnvironment({DOCKER_HOST:'tcp://remote.example.test:2375'}));
});
test('failure diagnostics redact generated credentials and database connection strings', () => {
  const input='known-value eyJhbGci.eyJzdWI.sig sb_secret_ABC postgres://postgres:pass@127.0.0.1/db password=raw-secret API_KEY: raw-key';
  const output=redactOutput(input,['known-value']);
  for (const value of ['known-value','eyJhbGci','sb_secret_ABC','postgres://','raw-secret','raw-key']) assert.equal(output.includes(value),false);
});
test('required published ports cannot pass with empty or wildcard bindings',()=>{
  assert.throws(()=>validateBindings({},55422));
  assert.throws(()=>validateBindings({'5432/tcp':[{HostIp:'0.0.0.0',HostPort:'55422'}]},55422));
  assert.throws(()=>validateBindings({'5432/tcp':[{HostIp:'127.0.0.1',HostPort:'9999'}]},55422));
  validateBindings({'5432/tcp':[{HostIp:'127.0.0.1',HostPort:'55422'}]},55422);
  validateBindings({}); // Internal-only services may have no published port.
});
test('network name alone does not authorize removal after an ambiguous create',()=>{
  for (const value of [{name:'owned',owner:null},{name:'owned',owner:'another-run'},{name:'different',owner:'our-run'}]) assert.throws(()=>validateNetworkOwner(value,'owned','our-run'));
  validateNetworkOwner({name:'owned',owner:'our-run'},'owned','our-run');
});
test('a run directory cannot write inside the app checkout or Git metadata, including parent symlinks',t=>{
  const parent=mkdtempSync(join(tmpdir(),'disclosed-runner-guard-'));
  t.after(()=>rmSync(parent,{recursive:true}));
  const repo=join(parent,'repo');mkdirSync(repo);mkdirSync(join(repo,'.git'));
  symlinkSync(repo,join(parent,'alias'));
  for (const path of [join(repo,'run'),join(repo,'.git','run'),join(parent,'alias','run')]) assert.throws(()=>safeRunDirectory(repo,path));
  assert.equal(safeRunDirectory(repo,join(parent,'run')),join(realpathSync(parent),'run'));
});
test('real Vitest positive control loads a synthetic env file; isolated config keeps it out',t=>{
  const root=realpathSync(mkdtempSync(join(tmpdir(),'disclosed-env-canary-')));
  t.after(()=>rmSync(root,{recursive:true}));
  const sourceRepo=realpathSync(process.env.DISCLOSED_TEST_REPO ?? fileURLToPath(new URL('../', import.meta.url)));
  const repo=join(root,'repo'),run=join(root,'run');mkdirSync(repo);mkdirSync(run);
  writeFileSync(join(repo,'.env'),'VITE_DISPOSABLE_CANARY=synthetic-file-value\n');
  writeFileSync(join(repo,'vitest.config.ts'),'export default {test:{include:["canary.test.ts"]}};\n');
  writeFileSync(join(repo,'canary.test.ts'),`import {test,expect} from ${JSON.stringify(join(sourceRepo,'node_modules/vitest/dist/index.js'))};\ntest('canary',()=>expect(process.env.VITE_DISPOSABLE_CANARY).toBe(process.env.EXPECT_CANARY==='loaded'?'synthetic-file-value':undefined));\n`);
  for (const mode of ['loaded','isolated']) {
    const config=join(run,`${mode}.config.mjs`);
    writeFileSync(config,isolatedVitestConfig(repo,run).replace('envDir:false',mode==='loaded'?`envDir:${JSON.stringify(repo)}`:'envDir:false'));
    const result=spawnSync(process.execPath,[join(sourceRepo,'node_modules/vitest/vitest.mjs'),'run','--config',config,'--reporter=json'],{
      cwd:run,env:{PATH:process.env.PATH,HOME:root,EXPECT_CANARY:mode,CI:'1',NO_COLOR:'1'},encoding:'utf8',timeout:30000,
    });
    assert.equal(result.status,0,result.stderr);
    const report=JSON.parse(result.stdout);assert.equal(report.success,true);assert.equal(report.numPassedTests,1);
  }
});
test('cleanup failure remains nonzero, all cleanup phases continue, and no pending receipt claims PASS',t=>{
  const parent=realpathSync(mkdtempSync(join(tmpdir(),'disclosed-cleanup-guard-')));
  t.after(()=>rmSync(parent,{recursive:true}));
  const repo=join(parent,'repo'),runDir=join(parent,'run');
  mkdirSync(join(repo,'supabase/migrations'),{recursive:true});mkdirSync(join(repo,'src/test'),{recursive:true});
  for(let i=1;i<=16;i++) writeFileSync(join(repo,'supabase/migrations',`${String(i).padStart(4,'0')}_test.sql`),'-- synthetic test\n');
  for(const name of TESTS)writeFileSync(join(repo,'src/test',name),'// synthetic test\n');
  writeFileSync(join(repo,'vitest.config.ts'),'export default {};\n');
  writeFileSync(join(repo,'package.json'),'{}\n');writeFileSync(join(repo,'package-lock.json'),'{}\n');
  const previous=process.env.DOCKER_HOST;process.env.DOCKER_HOST='unix:///synthetic.sock';
  t.after(()=>{if(previous===undefined)delete process.env.DOCKER_HOST;else process.env.DOCKER_HOST=previous;});
  let started=false,stopped=false,projectId,network;const calls=[];
  const execute=(bin,args,options)=>{
    assert.equal(options.env.HOME,join(runDir,'home'));
    assert.equal(options.env.DOCKER_CONFIG,join(runDir,'docker-config'));
    calls.push([bin,...args]);let stdout='';
    if(bin==='supabase' && args[0]==='--version')stdout='2.117.0';
    else if(bin==='supabase' && args[0]==='start'){
      started=true;projectId=JSON.parse(readFileSync(join(runDir,'receipt.json'))).projectId;network=`${projectId}-loopback`;
    } else if(bin==='supabase' && args[0]==='status')stdout=JSON.stringify(status);
    else if(bin==='supabase' && args[0]==='stop'){
      const receipt=JSON.parse(readFileSync(join(runDir,'receipt.json')));
      assert.equal(receipt.result,'CHECKS_PASSED_CLEANUP_PENDING');assert.equal(receipt.cleanup,'NOT_RUN');
      stopped=true;return {status:1,stdout:'',stderr:'synthetic stop failure'};
    } else if(bin==='docker' && args[0]==='ps')stdout=started&&!stopped?`supabase_db_${projectId}\nsupabase_kong_${projectId}`:'';
    else if(bin==='docker' && args[0]==='inspect')stdout=JSON.stringify({'port/tcp':[{HostIp:'127.0.0.1',HostPort:args.at(-1).startsWith('supabase_db_')?'55422':'55421'}]});
    else if(bin==='docker' && args[0]==='exec')stdout=Array.from({length:16},(_,i)=>String(i+1).padStart(4,'0')).join('\n');
    else if(bin==='docker' && args[0]==='network' && args[1]==='ls')stdout=started?network:'';
    else if(bin==='docker' && args[0]==='network' && args[1]==='inspect')stdout=JSON.stringify({name:network,owner:JSON.parse(readFileSync(join(runDir,'receipt.json'))).networkOwner});
    else if(bin==='lsof')stdout=`127.0.0.1:${args[1].slice(6)} (LISTEN)`;
    else if(bin===process.execPath){
      assert.ok(args.includes('--config'));
      assert.ok(readFileSync(args[args.indexOf('--config')+1],'utf8').includes('envDir:false'));
      stdout=JSON.stringify({success:true,numTotalTests:4,numPassedTests:4,numFailedTests:0,numPendingTests:0,testResults:TESTS.map(name=>({name:join(repo,'src/test',name),assertionResults:[{title:'synthetic',status:'passed'}]}))});
    }
    return {status:0,stdout,stderr:''};
  };
  const result=runGate({repo,runDir},{execute});
  assert.equal(result.result,'FAIL');assert.equal(result.cleanup,'FAIL');
  assert.ok(calls.some(([bin,...args])=>bin==='docker' && args[0]==='network' && args[1]==='rm'));
  assert.ok(result.phases.some(p=>p.phase==='volumes-after'));
  assert.match(result.cleanupErrors.join(' '),/owned-project-stop failed/);
});
