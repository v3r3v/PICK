import type { Account, Action, Command, Snapshot, Receipt, Scenario, QueueSnapshot, QueueCommand, LocationSample, DemoLocationMode } from '@pick/contracts';

type Session = { token: string; account: Account; expiresAt: string; tripId: string; sessionId:string };
export type ClientState = { session: Session | null; snapshot: Snapshot | null; lastRefresh: number; connected: boolean; busy: boolean; error: string | null; notice: string | null; paused: boolean; dropNext: boolean; queue:QueueSnapshot|null; locationMode:DemoLocationMode; dragging:boolean; pending: Command | QueueCommand | null };
export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
export class DemoClient {
  state: ClientState = { session: null, snapshot: null, queue:null, dragging:false, lastRefresh: 0, connected: false, busy: false, error: null, notice: null, paused: false, dropNext: false, locationMode:'device', pending: null };
  private epoch = 0;
  private refreshingEpoch: number | null = null;
  private listeners = new Set<() => void>();
  constructor(public url: string, private fetcher: typeof fetch = (input, init) => fetch(input, init)) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getState = () => this.state;
  private set(update: Partial<ClientState>) { this.state = { ...this.state, ...update }; this.listeners.forEach(l => l()); }
  private async request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
    const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), 1800);
    try {
      const response = await this.fetcher(`${this.url}${path}`, { ...options, signal: abort.signal, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
      const result = await response.json();
      if (!response.ok) throw new ApiError(response.status, result.code || 'ERROR', result.message || 'Request failed.');
      return result as T;
    } finally { clearTimeout(timer); }
  }
  async selectAccount(accountId: string) {
    const epoch = ++this.epoch; const old = this.state.session;
    this.set({ session: null, snapshot: null, queue:null, locationMode:'device', dragging:false, lastRefresh: 0, connected: false, busy: true, error: null, notice: null, pending: null, paused: false, dropNext: false });
    if (old) void this.request('/demo/session', { method: 'DELETE' }, old.token).catch(() => {});
    try {
      const session = await this.request<Session>('/demo/sessions', { method: 'POST', body: JSON.stringify({ accountId }) });
      if (epoch !== this.epoch) return;
      this.set({ session, busy: false }); await this.refresh();
    } catch (e) { if (epoch === this.epoch) this.set({ busy: false, error: this.connectionMessage(e) }); }
  }
  async logout() {
    const old = this.state.session; const epoch = ++this.epoch;
    this.set({ session: null, snapshot: null, queue:null, dragging:false, lastRefresh: 0, connected: false, busy: false, pending: null, error: null, notice: null, dropNext: false });
    if (old) try { await this.request('/demo/session', { method: 'DELETE' }, old.token); } catch { if (epoch === this.epoch) this.set({ notice: 'Local session cleared. Server sign-out could not be confirmed; the demo token will expire.' }); }
  }
  private connectionMessage(e: unknown) { return e instanceof ApiError ? e.message : `Cannot reach PICK at ${this.url}. Start the API, check the address and use the same network for phone review.`; }
  async refresh() {
    const session = this.state.session, epoch = this.epoch;
    if (!session || this.state.paused || this.refreshingEpoch === epoch) return;
    this.refreshingEpoch = epoch;
    try {
      const [snapshot,queue] = await Promise.all([this.request<Snapshot>(`/v1/trips/${session.tripId}`, {}, session.token),this.request<QueueSnapshot>(`/v1/queues/${session.sessionId}`,{},session.token)]);
      if (epoch !== this.epoch || this.state.paused) return;
      if (this.state.snapshot && snapshot.generation === this.state.snapshot.generation && snapshot.version < this.state.snapshot.version) return;
      this.set({ snapshot, queue, connected: true, lastRefresh: Date.now() });
    } catch (e) {
      if (epoch !== this.epoch) return;
      if (e instanceof ApiError && e.status === 401) { ++this.epoch; this.set({ session: null, snapshot: null, queue:null, dragging:false, connected: false, pending: null, error: e.message, busy: false }); }
      else this.set({ connected: false });
    } finally { if (this.refreshingEpoch === epoch) this.refreshingEpoch = null; }
  }
  tick() {
    if (this.state.connected && Date.now() - this.state.lastRefresh > 2500) this.set({ connected: false });
    void this.refresh();
  }
  setPaused(paused: boolean) { this.set({ paused, connected: paused ? false : this.state.connected }); if (!paused) void this.refresh(); }
  setDropNext(dropNext: boolean) { this.set({ dropNext }); }
  async execute(action: Action, location?:LocationSample) {
    const { session, snapshot, connected, paused, busy, pending } = this.state;
    if (!session || !snapshot || !connected || paused || busy || pending || Date.now() - this.state.lastRefresh > 2500) return;
    const epoch = this.epoch;
    const command: Command = { tripId: snapshot.tripId, expectedVersion: snapshot.version, generation: snapshot.generation, key: `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`, action, ...(location?{location}: {}) };
    return this.send(command,epoch,session.token,'/v1/commands');
  }
  async executeQueue(input:Omit<QueueCommand,'key'|'sessionId'|'generation'|'expectedRevision'>,expectedRevision?:number){
    const {session,queue,connected,paused,busy,pending}=this.state;
    if(!session||!queue||!connected||paused||busy||pending||Date.now()-this.state.lastRefresh>2500)return false;
    const command:QueueCommand={...input,sessionId:queue.sessionId,generation:queue.generation,expectedRevision:expectedRevision??queue.revision,key:`queue-${Date.now()}-${Math.random().toString(36).slice(2)}`};
    return this.send(command,this.epoch,session.token,'/v1/queue-commands');
  }
  private async send(command:Command|QueueCommand,epoch:number,token:string,path:string){
    const drop=this.state.dropNext;this.set({busy:true,error:null,notice:null,dropNext:false});let success=false;
    try{
      await this.request<Receipt>(path,{method:'POST',body:JSON.stringify(command),headers:drop?{'X-Demo-Drop-Response':'once'}:{}},token);
      if(epoch===this.epoch){this.set({notice:'Recorded. Other participants will see the update.'});success=true;}
    }catch(e){
      if(epoch!==this.epoch)return false;
      if(e instanceof ApiError&&e.status<500)this.set({error:e.message});
      else {this.set({pending:command,error:'The response was lost. Checking its receipt before another action.'});await this.resolveReceipt();success=!this.state.pending;}
    }finally{if(epoch===this.epoch){this.set({busy:false});await this.refresh();}}
    return success;
  }
  async selectTrip(tripId:string){
    if(!this.state.session||this.state.busy||this.state.pending)return;
    ++this.epoch;this.set({session:{...this.state.session,tripId},snapshot:null,connected:false,error:null,notice:null});await this.refresh();
  }
  setLocationMode(locationMode:DemoLocationMode){this.set({locationMode});}
  setDragging(dragging:boolean){this.set({dragging});}
  async migrateQueue(){
    this.set({busy:true,error:null});
    try{await this.request('/demo/migrate',{method:'POST',body:JSON.stringify({confirm:'ADD_QUEUE_FIXTURES'})});this.set({notice:'Extra vehicles added. Existing trips and sessions were preserved.'});}
    catch(e){this.set({error:this.connectionMessage(e)});}finally{this.set({busy:false});await this.refresh();}
  }
  async resolveReceipt() {
    const { session, pending } = this.state; const epoch = this.epoch;
    if (!session || !pending || this.state.paused) return;
    try {
      const receipt = await this.request<Receipt>(`/v1/receipts/${pending.key}`, {}, session.token);
      if (epoch === this.epoch && this.state.pending?.key === pending.key) this.set({ pending: null, error: null, notice: `Response recovered: the server recorded this action at revision ${receipt.committedVersion}. It was not submitted again.` });
    } catch (e) { if (epoch === this.epoch) this.set({ error: e instanceof ApiError && e.status === 404 ? 'No committed receipt was found. Refresh and verify actual custody before clearing this uncertainty. Nothing will be replayed.' : 'Receipt lookup is unavailable. Keep the child supervised; reconnect and check again.' }); }
  }
  clearPendingAfterReview() { if (this.state.connected) this.set({ pending: null, error: null, notice: 'Uncertain request cleared after your review. No command was replayed.' }); }
  async reset(scenario: Scenario) {
    const epoch = this.epoch;
    this.set({ busy: true, error: null });
    try {
      await this.request('/demo/reset', { method: 'POST', body: JSON.stringify({ scenario, confirm: 'RESET_SHARED_DEMO' }) });
      if (epoch !== this.epoch) return;
      ++this.epoch; this.set({ session: null, snapshot: null, queue:null, dragging:false, connected: false, pending: null, busy: false, notice: 'Shared scenario reset. All reviewers need to choose an account again.' });
    } catch (e) { if (epoch === this.epoch) this.set({ busy: false, error: this.connectionMessage(e) }); }
  }
}
