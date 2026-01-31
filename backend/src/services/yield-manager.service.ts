export class YieldManagerService {
  private isActive: boolean;
  private updateInterval: NodeJS.Timeout | null = null;
  private currentData: any = {};

  constructor() {
    this.isActive = false;
  }

  public async start(): Promise<void> {
    this.isActive = true;
    console.log('YieldManagerService started successfully');
    
    // Start periodic updates every 45 seconds
    this.updateInterval = setInterval(async () => {
      await this.updateYieldData();
    }, 45000);
    
    // Initial data fetch
    await this.updateYieldData();
  }

  public stop(): void {
    this.isActive = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('YieldManagerService stopped');
  }

  private async updateYieldData(): Promise<void> {
    try {
      // This will be called by the main server to update data
      console.log('Updating yield data...');
    } catch (error) {
      console.error('Error updating yield data:', error);
    }
  }

  public async fetchNow(): Promise<any[]> {
    try {
      await this.updateYieldData();
      return Array.isArray(this.currentData) ? this.currentData : [];
    } catch (error) {
      console.error('Error in fetchNow:', error);
      return [];
    }
  }

  public setCurrentData(data: any): void {
    this.currentData = data;
  }

  public getCurrentData(): any {
    return this.currentData;
  }

  public getStatus(): { active: boolean } {
    return { active: this.isActive };
  }
}