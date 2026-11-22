import test from 'node:test'
import {runNocturneResponseMatrix} from '../scripts/nocturne-response-matrix.mjs'
test('NT12 unified response/lifecycle matrix at30/60/120Hz with exact final delivery',()=>{runNocturneResponseMatrix()})
