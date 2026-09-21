export class HoldTracker {
  private readonly held = new Map<string, Set<number>>();

  press(socketId: string, elevatorId: number): void {
    let set = this.held.get(socketId);
    if (!set) {
      set = new Set<number>();
      this.held.set(socketId, set);
    }
    set.add(elevatorId);
  }

  release(socketId: string, elevatorId: number): void {
    this.held.get(socketId)?.delete(elevatorId);
  }

  releaseAll(socketId: string): number[] {
    const set = this.held.get(socketId);
    this.held.delete(socketId);
    return set ? [...set] : [];
  }
}
