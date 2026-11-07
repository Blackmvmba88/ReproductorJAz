'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {shortcutAction}=require('../media-controls.js');
test('keyboard actions map to transport',()=>{
 assert.equal(shortcutAction(' ','BODY',false),'toggle');
 assert.equal(shortcutAction('n','BODY',false),'next');
 assert.equal(shortcutAction('p','BODY',false),'previous');
 assert.equal(shortcutAction('ArrowRight','BODY',false),'forward');
 assert.equal(shortcutAction('m','BODY',false),'mute');
});
test('shortcuts do not hijack form fields or modified keys',()=>{
 assert.equal(shortcutAction(' ','INPUT',false),null);
 assert.equal(shortcutAction('n','TEXTAREA',false),null);
 assert.equal(shortcutAction('p','SELECT',false),null);
 assert.equal(shortcutAction('n','BODY',true),null);
 assert.equal(shortcutAction('x','BODY',false),null);
});
