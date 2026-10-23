import React from 'react';
import {useDemo} from '../src/session';
import TripScreen from '../src/trip-screen';
import {GateQueue,ClassroomQueue} from '../src/queue-screen';
export default function Today(){const {session}=useDemo();return session?.account.role==='gate'?<GateQueue/>:session?.account.role==='teacher'?<ClassroomQueue/>:<TripScreen/>;}
