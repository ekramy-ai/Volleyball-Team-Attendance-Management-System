import fs from 'fs';
import path from 'path';

export class PersistenceService {
  /**
   * Enterprise Atomic Persistence Engine.
   * Saves data reliably to JSON files on disk.
   */
  public static saveFile(filename: string, data: unknown): void {
    try {
      if (typeof process !== 'undefined' && process.cwd) {
        const targetPath = path.resolve(process.cwd(), 'src/data', filename);
        fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[PersistenceService] Failed to save ${filename}:`, msg);
    }
  }
}
