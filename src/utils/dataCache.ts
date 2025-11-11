/**
 * Simple in-memory cache for product data
 */
class DataCache {
  private cache = new Map<string, any>();
  private intelliPartsData: any = null;
  private imageUrls = new Map<string, string>();
  private pageData = new Map<string, any>();
  private jsonData = new Map<string, any>();
  private csvData = new Map<string, any>();

  /**
   * Check if product data exists in cache for the given path
   */
  hasProductData(path: string): boolean {
    return this.cache.has(path);
  }

  /**
   * Get cached product data for the given path
   */
  getProductData(path: string): any {
    return this.cache.get(path);
  }

  /**
   * Set product data in cache for the given path
   */
  setProductData(path: string, data: any): void {
    this.cache.set(path, data);
  }

  /**
   * Check if IntelliParts data exists in cache
   */
  hasIntelliPartsData(): boolean {
    return this.intelliPartsData !== null;
  }

  /**
   * Get cached IntelliParts data
   */
  getIntelliPartsData(): any {
    return this.intelliPartsData;
  }

  /**
   * Set IntelliParts data in cache
   */
  setIntelliPartsData(data: any): void {
    this.intelliPartsData = data;
  }

  /**
   * Check if index data exists in cache
   */
  hasIndexData(): boolean {
    return this.cache.has('indexData');
  }

  /**
   * Get cached index data
   */
  getIndexData(): any {
    return this.cache.get('indexData');
  }

  /**
   * Set index data in cache
   */
  setIndexData(data: any): void {
    this.cache.set('indexData', data);
  }

  /**
   * Get cached image URL
   */
  getImageUrl(key: string): string | null {
    return this.imageUrls.get(key) || null;
  }

  /**
   * Set image URL in cache
   */
  setImageUrl(key: string, url: string): void {
    this.imageUrls.set(key, url);
  }

  /**
   * Get cached page data
   */
  getPageData(key: string): any {
    return this.pageData.get(key);
  }

  /**
   * Set page data in cache
   */
  setPageData(key: string, data: any): void {
    this.pageData.set(key, data);
  }

  /**
   * Get cached JSON data
   */
  getJsonData(key: string): any {
    return this.jsonData.get(key);
  }

  /**
   * Set JSON data in cache
   */
  setJsonData(key: string, data: any): void {
    this.jsonData.set(key, data);
  }

  /**
   * Get cached CSV data
   */
  getCsvData(key: string): any {
    return this.csvData.get(key);
  }

  /**
   * Set CSV data in cache
   */
  setCsvData(key: string, data: any): void {
    this.csvData.set(key, data);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
    this.intelliPartsData = null;
    this.imageUrls.clear();
    this.pageData.clear();
    this.jsonData.clear();
    this.csvData.clear();
  }

  /**
   * Remove specific cached data by path
   */
  removeProductData(path: string): void {
    this.cache.delete(path);
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size + (this.intelliPartsData ? 1 : 0) + this.imageUrls.size + this.pageData.size + this.jsonData.size + this.csvData.size;
  }

  /**
   * Generic cache methods for compatibility
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  get<T = any>(key: string): T | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  clearAll(): void {
    this.clear();
  }
}

// Export a singleton instance
const dataCache = new DataCache();
export default dataCache;
