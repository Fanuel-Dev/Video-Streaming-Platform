import { OfflineDownload } from '../types';

const DB_NAME = 'VideoStreamingOfflineDB';
const DB_VERSION = 1;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store for actual video files as Blobs
      if (!db.objectStoreNames.contains('video_blobs')) {
        db.createObjectStore('video_blobs');
      }

      // Store for metadata of downloads
      if (!db.objectStoreNames.contains('downloads_metadata')) {
        db.createObjectStore('downloads_metadata', { keyPath: 'videoId' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Save a video Blob to IndexedDB
export async function saveVideoBlob(videoId: string, blob: Blob): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('video_blobs', 'readwrite');
    const store = transaction.objectStore('video_blobs');
    const request = store.put(blob, videoId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get a video Blob from IndexedDB
export async function getVideoBlob(videoId: string): Promise<Blob | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('video_blobs', 'readonly');
    const store = transaction.objectStore('video_blobs');
    const request = store.get(videoId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

// Delete a video and its metadata from IndexedDB
export async function deleteVideo(videoId: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['video_blobs', 'downloads_metadata'], 'readwrite');
    
    const blobsStore = transaction.objectStore('video_blobs');
    blobsStore.delete(videoId);

    const metaStore = transaction.objectStore('downloads_metadata');
    metaStore.delete(videoId);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// Save or Update Download Metadata
export async function updateDownloadMetadata(download: OfflineDownload): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('downloads_metadata', 'readwrite');
    const store = transaction.objectStore('downloads_metadata');
    const request = store.put(download);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get all Download Metadata
export async function getAllDownloadsMetadata(): Promise<OfflineDownload[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('downloads_metadata', 'readonly');
    const store = transaction.objectStore('downloads_metadata');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
}
