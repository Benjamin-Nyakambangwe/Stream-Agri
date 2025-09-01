// import { powersync } from '@/powersync/system';
// import axios from 'axios';

// /**
//  * Image Upload Retry Service
//  * Runs every 15 minutes to upload images that failed during initial confirmation
//  */

// const IMAGE_UPLOAD_SERVER = 'https://gmsapp.eport.systems/api/upload/';
// const RETRY_INTERVAL = 30 * 1000; // 30 seconds - much more reliable in production
// const MIN_TIME_BETWEEN_CHECKS = 3 * 60 * 1000; // 3 minutes minimum between actual upload attempts

// interface ImageUploadRecord {
//   id: string;
//   mobile_grower_image: string | null;
//   mobile_grower_national_id_image: string | null;
//   grower_image_url: string | null;
//   grower_national_id_image_url: string | null;
// }

// class ImageUploadService {
//   private intervalId: NodeJS.Timeout | null = null;
//   private isRunning = false;
//   private lastUploadAttempt = 0;

//   /**
//    * Upload grower image to server
//    */
//   private async sendGrowerImageToServer(mobileGrowerImageEncoded: string): Promise<string> {
//     console.log('🔄 Retrying grower image upload to server');

//     try {
//       const options = {
//         method: 'POST',
//         url: IMAGE_UPLOAD_SERVER,
//         headers: {'Content-Type': 'application/json'},
//         // timeout: 30000, // 30 second timeout
//         data: {
//           image: mobileGrowerImageEncoded,
//         }
//       };
      
//       const response = await axios.request(options);
//       console.log('✅ Grower image upload response:', response.data);
      
//       if (response.data.error) {
//         console.error('❌ Server error uploading grower image:', response.data.error);
//         throw new Error(response.data.error);
//       }
      
//       if (!response.data.url) {
//         throw new Error('Server did not return image URL');
//       }
      
//       return response.data.url;
//     } catch (error) {
//       console.error('❌ Error uploading grower image:', error);
//       if (axios.isAxiosError(error)) {
//         if (error.code === 'ECONNABORTED') {
//           throw new Error('Image upload timed out. Please check your internet connection and try again.');
//         } else if (error.response) {
//           throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
//         } else if (error.request) {
//           throw new Error('Network error. Please check your internet connection and try again.');
//         }
//       }
//       throw new Error('Failed to upload grower image. Please try again.');
//     }
//   }

//   /**
//    * Upload grower national ID image to server
//    */
//   private async sendGrowerNationalIdImageToServer(mobileGrowerNationalIdImageEncoded: string): Promise<string> {
//     console.log('🔄 Retrying grower national ID image upload to server');

//     try {
//       const options = {
//         method: 'POST',
//         url: IMAGE_UPLOAD_SERVER,
//         headers: {'Content-Type': 'application/json'},
//         // timeout: 30000, // 30 second timeout
//         data: {
//           image: mobileGrowerNationalIdImageEncoded,
//         }
//       };

//       const response = await axios.request(options);
//       console.log('✅ National ID image upload response:', response.data);

//       if (response.data.error) {
//         console.error('❌ Server error uploading national ID image:', response.data.error);
//         throw new Error(response.data.error);
//       }

//       if (!response.data.url) {
//         throw new Error('Server did not return image URL');
//       }

//       return response.data.url;
//     } catch (error) {
//       console.error('❌ Error uploading national ID image:', error);
//       if (axios.isAxiosError(error)) {
//         if (error.code === 'ECONNABORTED') {
//           throw new Error('National ID image upload timed out. Please check your internet connection and try again.');
//         } else if (error.response) {
//           throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
//         } else if (error.request) {
//           throw new Error('Network error. Please check your internet connection and try again.');
//         }
//       }
//       throw new Error('Failed to upload national ID image. Please try again.');
//     }
//   }

//   /**
//    * Find records that need image uploads
//    */
//   private async findRecordsNeedingUpload(): Promise<ImageUploadRecord[]> {
//     try {
//       // First, find records from odoo_gms_input_confirmations_lines with missing image URLs
//       const confirmationLinesQuery = `
//         SELECT id, grower_image_url, grower_national_id_image_url
//         FROM odoo_gms_input_confirmations_lines
//         WHERE issue_state = 'received'
//         AND (grower_image_url IS NULL OR grower_national_id_image_url IS NULL)
//       `;

//       interface ConfirmationRecord {
//         id: string;
//         grower_image_url: string | null;
//         grower_national_id_image_url: string | null;
//       }

//       interface MediaRecord {
//         mobile_grower_image: string | null;
//         mobile_grower_national_id_image: string | null;
//       }

//       const confirmationRecords = await powersync.getAll(confirmationLinesQuery) as ConfirmationRecord[];
//       console.log(`📋 Found ${confirmationRecords.length} confirmation records with missing image URLs`);

//       if (confirmationRecords.length === 0) {
//         return [];
//       }

//       // For each confirmation record, get the corresponding mobile images from media_files table
//       const imageUploadRecords: ImageUploadRecord[] = [];
      
//       console.log('🔄 Starting to process confirmation records...');
//       for (let i = 0; i < confirmationRecords.length; i++) {
//         const record = confirmationRecords[i];
//         console.log(`🔍 Processing confirmation record ${i + 1}/${confirmationRecords.length}: ${record.id}`);
//         try {
//           const mediaQuery = `
//             SELECT mobile_grower_image, mobile_grower_national_id_image
//             FROM media_files
//             WHERE id = ?
//           `;
          
//           console.log(`📊 Querying media_files for record: ${record.id}`);
//           const mediaRecords = await powersync.getAll(mediaQuery, [record.id]) as MediaRecord[];
//           console.log(`🔍 Found ${mediaRecords.length} media records for ${record.id}`);
          
//           if (mediaRecords.length > 0) {
//             const mediaRecord = mediaRecords[0];
            
//             // Only include if there are mobile images to upload for missing URLs
//             const needsGrowerImageUpload = !record.grower_image_url && mediaRecord.mobile_grower_image;
//             const needsNationalIdUpload = !record.grower_national_id_image_url && mediaRecord.mobile_grower_national_id_image;
            
//             console.log(`🔍 Record ${record.id} analysis:`, {
//               grower_image_url: record.grower_image_url,
//               grower_national_id_image_url: record.grower_national_id_image_url,
//               has_mobile_grower_image: !!mediaRecord.mobile_grower_image,
//               has_mobile_national_id_image: !!mediaRecord.mobile_grower_national_id_image,
//               needsGrowerImageUpload,
//               needsNationalIdUpload
//             });
            
//             if (needsGrowerImageUpload || needsNationalIdUpload) {
//               console.log(`✅ Adding record ${record.id} to upload queue`);
//               imageUploadRecords.push({
//                 id: record.id,
//                 grower_image_url: record.grower_image_url,
//                 grower_national_id_image_url: record.grower_national_id_image_url,
//                 mobile_grower_image: mediaRecord.mobile_grower_image,
//                 mobile_grower_national_id_image: mediaRecord.mobile_grower_national_id_image
//               });
//             } else {
//               console.log(`⏭️ Skipping record ${record.id} - no upload needed`);
//             }
//           } else {
//             console.log(`⚠️ No media records found for ${record.id}`);
//           }
//         } catch (mediaError) {
//           console.error(`❌ Error fetching media files for record ${record.id}:`, mediaError);
//           // Continue with other records
//         }
//         console.log(`✅ Completed processing confirmation record: ${record.id}`);
//       }
      
//       console.log('🏁 Finished processing all confirmation records');

//       console.log(`📋 Found ${imageUploadRecords.length} records needing image upload`);
//       // Log record IDs only to avoid potential issues with large image data
//       console.log('record IDs:', imageUploadRecords.map(r => r.id));

//       console.log('🔄 About to return imageUploadRecords...');
//       return imageUploadRecords;
//     } catch (error) {
//       console.error('❌ Error finding records needing upload:', error);
//       return [];
//     }
//   }

//   /**
//    * Process a single record for image uploads
//    */
//   private async processRecord(record: ImageUploadRecord): Promise<void> {
//     console.log(`🔄 Processing record ${record.id} for image uploads`);
    
//     let growerImageUrl = record.grower_image_url;
//     let growerNationalIdImageUrl = record.grower_national_id_image_url;
//     let hasUpdates = false;

//     try {
//       // Upload grower image if URL is missing
//       if (!growerImageUrl && record.mobile_grower_image) {
//         console.log(`📤 Uploading grower image for record ${record.id}`);
//         growerImageUrl = await this.sendGrowerImageToServer(record.mobile_grower_image);
//         hasUpdates = true;
//         console.log(`✅ Grower image uploaded successfully for record ${record.id}`);
//       }

//       // Upload national ID image if URL is missing
//       if (!growerNationalIdImageUrl && record.mobile_grower_national_id_image) {
//         console.log(`📤 Uploading national ID image for record ${record.id}`);
//         growerNationalIdImageUrl = await this.sendGrowerNationalIdImageToServer(record.mobile_grower_national_id_image);
//         hasUpdates = true;
//         console.log(`✅ National ID image uploaded successfully for record ${record.id}`);
//       }

//       // Update database if we have new URLs
//       if (hasUpdates) {
//         await powersync.execute(`
//           UPDATE odoo_gms_input_confirmations_lines 
//           SET grower_image_url = ?, grower_national_id_image_url = ?
//           WHERE id = ?
//         `, [growerImageUrl, growerNationalIdImageUrl, record.id]);
        
//         console.log(`✅ Database updated successfully for record ${record.id}`);
//       }

//     } catch (error) {
//       console.error(`❌ Failed to process record ${record.id}:`, error);
//       // Continue processing other records even if one fails
//     }
//   }

//   /**
//    * Main processing function - runs the retry logic
//    */
//   private async processImageUploads(): Promise<void> {
//     if (this.isRunning) {
//       return; // Skip if already running
//     }

//     // Check if enough time has passed since last upload attempt
//     const now = Date.now();
//     if (now - this.lastUploadAttempt < MIN_TIME_BETWEEN_CHECKS) {
//       return; // Not enough time has passed, skip this cycle
//     }

//     this.isRunning = true;
//     this.lastUploadAttempt = now;
//     console.log('🚀 Starting image upload retry service');

//     try {
//       console.log('🔍 Calling findRecordsNeedingUpload...');
//       const records = await this.findRecordsNeedingUpload();
//       console.log('✅ findRecordsNeedingUpload completed, returned records:', records.length);
      
//       if (records.length === 0) {
//         console.log('✅ No records need image uploads');
//         return;
//       }

//       console.log(`📊 Processing ${records.length} records for image uploads`);
      
//       // Process records sequentially to avoid overwhelming the server
//       for (let i = 0; i < records.length; i++) {
//         const record = records[i];
//         console.log(`🚀 Starting to process record ${i + 1}/${records.length}: ${record.id}`);
//         await this.processRecord(record);
//         console.log(`✅ Completed processing record ${i + 1}/${records.length}: ${record.id}`);
//         // Small delay between records to be nice to the server
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }

//       console.log('✅ Image upload retry service completed successfully');
      
//     } catch (error) {
//       console.error('❌ Error in image upload retry service:', error);
//     } finally {
//       this.isRunning = false;
//     }
//   }

//   /**
//    * Start the image upload retry service
//    */
//   public start(): void {
//     if (this.intervalId) {
//       console.log('⚠️ Image upload service already started');
//       return;
//     }

//     console.log('🔄 Starting image upload retry service (checks every 30 seconds)');
    
//     // Run immediately on start
//     this.processImageUploads();
    
//     // Check every 30 seconds (much more reliable in production)
//     this.intervalId = setInterval(() => {
//       this.processImageUploads();
//     }, RETRY_INTERVAL);
//   }

//   /**
//    * Stop the image upload retry service
//    */
//   public stop(): void {
//     if (this.intervalId) {
//       clearInterval(this.intervalId);
//       this.intervalId = null;
//       console.log('⏹️ Image upload retry service stopped');
//     }
//   }

//   /**
//    * Manually trigger a single run (useful for testing)
//    */
//   public async runOnce(): Promise<void> {
//     console.log('🔄 Manually triggering image upload retry service');
//     await this.processImageUploads();
//   }

//   /**
//    * Force run upload service immediately (bypasses time check)
//    */
//   public async forceRun(): Promise<void> {
//     if (this.isRunning) {
//       console.log('⏸️ Upload service already running');
//       return;
//     }

//     this.isRunning = true;
//     this.lastUploadAttempt = Date.now();
//     console.log('🚀 Force running image upload service');

//     try {
//       const records = await this.findRecordsNeedingUpload();
      
//       if (records.length === 0) {
//         console.log('✅ No records need image uploads');
//         return;
//       }

//       console.log(`📊 Processing ${records.length} records for image uploads`);
      
//       for (let i = 0; i < records.length; i++) {
//         const record = records[i];
//         await this.processRecord(record);
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       }

//       console.log('✅ Force upload completed successfully');
//     } catch (error) {
//       console.error('❌ Error in force upload:', error);
//     } finally {
//       this.isRunning = false;
//     }
//   }
// }

// // Export singleton instance
// export const imageUploadService = new ImageUploadService();

// // Auto-start the service when imported
// export const startImageUploadService = () => {
//   imageUploadService.start();
// };

// // Export for manual control
// export const stopImageUploadService = () => {
//   imageUploadService.stop();
// };

// export const runImageUploadServiceOnce = () => {
//   return imageUploadService.runOnce();
// };

// export const forceRunImageUploadService = () => {
//   return imageUploadService.forceRun();
// };

// /**
//  * Get count of records that need image uploads (for UI display)
//  */
// export const getUploadPendingCount = async (): Promise<number> => {
//   try {
//     // Query to find records with missing image URLs but that should have them
//     const confirmationLinesQuery = `
//       SELECT id, grower_image_url, grower_national_id_image_url
//       FROM odoo_gms_input_confirmations_lines
//       WHERE issue_state = 'received'
//       AND (grower_image_url IS NULL OR grower_national_id_image_url IS NULL)
//     `;

//     interface ConfirmationRecord {
//       id: string;
//       grower_image_url: string | null;
//       grower_national_id_image_url: string | null;
//     }

//     interface MediaRecord {
//       mobile_grower_image: string | null;
//       mobile_grower_national_id_image: string | null;
//     }

//     const confirmationRecords = await powersync.getAll(confirmationLinesQuery) as ConfirmationRecord[];
    
//     if (confirmationRecords.length === 0) {
//       return 0;
//     }

//     let pendingCount = 0;

//     // Check each record to see if it has mobile images that need uploading
//     for (const record of confirmationRecords) {
//       try {
//         const mediaQuery = `
//           SELECT mobile_grower_image, mobile_grower_national_id_image
//           FROM media_files
//           WHERE id = ?
//         `;
        
//         const mediaRecords = await powersync.getAll(mediaQuery, [record.id]) as MediaRecord[];
        
//         if (mediaRecords.length > 0) {
//           const mediaRecord = mediaRecords[0];
          
//           // Check if there are mobile images to upload for missing URLs
//           const needsGrowerImageUpload = !record.grower_image_url && mediaRecord.mobile_grower_image;
//           const needsNationalIdUpload = !record.grower_national_id_image_url && mediaRecord.mobile_grower_national_id_image;
          
//           if (needsGrowerImageUpload || needsNationalIdUpload) {
//             pendingCount++;
//           }
//         }
//       } catch (mediaError) {
//         console.error(`Error checking media for record ${record.id}:`, mediaError);
//         // Continue with other records
//       }
//     }

//     return pendingCount;
//   } catch (error) {
//     console.error('Error getting upload pending count:', error);
//     return 0;
//   }
// };












/**
 * GENERIC IMAGE UPLOAD SERVICE
 * 
 * This service handles image uploads for multiple table types using a model-based approach.
 * Key concept: The media_files table contains a 'model' field that indicates which target
 * table the images belong to (e.g., 'odoo_gms_grower_application', 'odoo_gms_input_confirmations_lines').
 * 
 * Architecture:
 * 1. Images are stored locally in media_files table with base64 data and model identifier
 * 2. Service finds records in target tables that have local images but missing server URLs
 * 3. Uploads images to server and updates target table with returned URLs
 * 4. Runs on interval to retry failed uploads
 * 
 * To add support for a new table:
 * 1. Add mapping configuration to MODEL_MAPPINGS
 * 2. Ensure media_files records are created with correct model field
 * 3. Target table must have URL fields for storing server image URLs
 */

import { powersync } from '@/powersync/system';
import axios from 'axios';

// Configuration
const IMAGE_UPLOAD_SERVER = 'https://gmsapp.eport.systems/api/upload/';
const RETRY_INTERVAL = 30 * 1000; // Check every 30 seconds
const MIN_TIME_BETWEEN_CHECKS = 3 * 60 * 1000; // Min 3 minutes between actual upload attempts

/**
 * Configuration structure for each table type
 * - mobileFields: Field names in media_files table containing base64 image data
 * - urlFields: Field names in target table to store server image URLs (must match mobileFields order)
 * - whereCondition: Optional SQL condition to filter which records to process
 */
interface ModelImageFields {
  [key: string]: {
    mobileFields: string[];
    urlFields: string[];
    whereCondition?: string;
  };
}

/**
 * MAPPING CONFIGURATION
 * Define field mappings for each table type that supports image uploads.
 * The key is the table name (stored in media_files.model field).
 */
const MODEL_MAPPINGS: ModelImageFields = {
  // Grower applications
  'odoo_gms_grower_application': {
    mobileFields: ['mobile_grower_image', 'mobile_grower_national_id_image'],
    urlFields: ['grower_image_url', 'grower_national_id_image_url'],
    // whereCondition: "issue_state = 'received'" // Only process received applications
  },
  
  // Input confirmations  
  'odoo_gms_input_confirmations_lines': {
    mobileFields: ['mobile_grower_image', 'mobile_grower_national_id_image'], 
    urlFields: ['grower_image_url', 'grower_national_id_image_url'],
    whereCondition: "issue_state = 'received'" // Only process confirmed inputs
  },
  
  // Example: Monitoring records (add when needed)
  // 'odoo_gms_monitoring_lines': {
  //   mobileFields: ['mobile_field_image', 'mobile_crop_image'],
  //   urlFields: ['field_image_url', 'crop_image_url'],
  //   whereCondition: "status = 'completed'" // Only process completed monitoring
  // }
};

// TypeScript interfaces for database query results
interface ModelRecord {
  model: string; // The table name from media_files.model field
}

interface TargetRecord {
  id: string; // Record ID
  [key: string]: any; // Dynamic fields (URL fields from target table)
}

interface MediaRecord {
  [key: string]: any; // Dynamic fields (mobile image fields from media_files)
}

/**
 * GENERIC IMAGE UPLOAD SERVICE CLASS
 * 
 * Handles automatic uploading of images from local storage to server.
 * Uses model-based configuration to work with multiple table types.
 */
class GenericImageUploadService {
  // Service state management
  private intervalId: NodeJS.Timeout | null = null; // Timer for periodic checks
  private isRunning = false; // Prevents concurrent executions
  private lastUploadAttempt = 0; // Timestamp of last upload attempt (for throttling)

  /**
   * UPLOAD SINGLE IMAGE TO SERVER
   * Takes base64 image data and uploads it to the configured server endpoint.
   * Returns the server URL for the uploaded image.
   */
  private async uploadImageToServer(imageData: string): Promise<string> {
    try {
      const response = await axios.post(IMAGE_UPLOAD_SERVER, {
        image: imageData
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      if (!response.data.url) {
        throw new Error('Server did not return image URL');
      }
      
      return response.data.url;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  /**
   * FIND ALL RECORDS THAT NEED IMAGE UPLOADS
   * 
   * Core discovery logic that:
   * 1. Finds all table types (models) that have media files
   * 2. For each model, finds records missing server URLs
   * 3. Matches them with local images from media_files table
   * 4. Returns combined records ready for processing
   * 
   * Flow:
   * - Query media_files for distinct model types
   * - For each model, use its mapping to find target table records with missing URLs
   * - Join with media_files to get local image data
   * - Return enriched records containing both target table and media data
   */
  private async findRecordsNeedingUpload(): Promise<any[]> {
    try {
      const recordsToProcess = [];
      
      // Step 1: Get all table types that have media files
      const modelsQuery = `
        SELECT DISTINCT model 
        FROM media_files 
        WHERE model IS NOT NULL
      `;
      
      const models = await powersync.getAll(modelsQuery) as ModelRecord[];
      console.log(`📋 Found ${models.length} models with media files`);

      // Step 2: Process each model type
      for (const { model } of models) {
        const mapping = MODEL_MAPPINGS[model];
        if (!mapping) {
          console.log(`⚠️ No mapping found for model: ${model}`);
          continue; // Skip unknown models
        }

        // Step 3: Build query to find target table records missing server URLs
        const urlFieldChecks = mapping.urlFields
          .map(field => `${field} IS NULL`)
          .join(' OR ');
        
        const whereClause = mapping.whereCondition 
          ? `WHERE ${mapping.whereCondition} AND (${urlFieldChecks})`
          : `WHERE ${urlFieldChecks}`;

        const targetTableQuery = `
          SELECT id, ${mapping.urlFields.join(', ')}
          FROM ${model}
          ${whereClause}
        `;

        const targetRecords = await powersync.getAll(targetTableQuery) as TargetRecord[];
        
        // Step 4: For each target record, get its local images from media_files
        for (const record of targetRecords) {
          const mediaQuery = `
            SELECT ${mapping.mobileFields.join(', ')}
            FROM media_files
            WHERE id = ? AND model = ?
          `;
          
          const mediaRecords = await powersync.getAll(mediaQuery, [record.id, model]) as MediaRecord[];
          
          // Step 5: Combine target record data with media file data
          if (mediaRecords.length > 0) {
            recordsToProcess.push({
              ...record,       // Target table fields (id, URL fields)
              ...mediaRecords[0], // Media file fields (mobile image data)
              model,           // Table name for updates
              mapping          // Configuration for processing
            });
          }
        }
      }

      console.log(`📋 Found ${recordsToProcess.length} records needing upload`);
      return recordsToProcess;
    } catch (error) {
      console.error('❌ Error finding records needing upload:', error);
      return [];
    }
  }

  /**
   * PROCESS SINGLE RECORD FOR IMAGE UPLOADS
   * 
   * Takes a record that contains both target table data and media file data,
   * uploads any missing images to the server, and updates the target table with URLs.
   * 
   * Flow:
   * 1. Loop through each image field pair (mobile field <-> URL field)
   * 2. Check if URL is missing but mobile image exists
   * 3. Upload mobile image to server and get URL
   * 4. Build update query for target table
   * 5. Execute update with all new URLs at once
   */
  private async processRecord(record: any): Promise<void> {
    console.log(`🔄 Processing record ${record.id} for model ${record.model}`);
    
    const updates: { [key: string]: string } = {}; // Collect URL updates
    let hasUpdates = false;

    try {
      // Step 1: Process each image field pair (mobile image -> server URL)
      for (let i = 0; i < record.mapping.mobileFields.length; i++) {
        const mobileField = record.mapping.mobileFields[i]; // e.g., 'mobile_grower_image'
        const urlField = record.mapping.urlFields[i];       // e.g., 'grower_image_url'
        
        const currentUrl = record[urlField];    // Current server URL (may be null)
        const mobileImage = record[mobileField]; // Local base64 image data

        // Step 2: Upload if URL is missing but local image exists
        if (!currentUrl && mobileImage) {
          console.log(`📤 Uploading ${mobileField} for record ${record.id}`);
          const uploadedUrl = await this.uploadImageToServer(mobileImage);
          updates[urlField] = uploadedUrl; // Collect for batch update
          hasUpdates = true;
          console.log(`✅ ${mobileField} uploaded successfully`);
        }
      }

      // Step 3: Update target table with all new URLs at once
      if (hasUpdates) {
        const setClause = Object.keys(updates)
          .map(field => `${field} = ?`)
          .join(', ');
        const values = Object.values(updates);

        await powersync.execute(`
          UPDATE ${record.model}
          SET ${setClause}
          WHERE id = ?
        `, [...values, record.id]);
        
        console.log(`✅ Database updated for record ${record.id}`);
      }

    } catch (error) {
      console.error(`❌ Failed to process record ${record.id}:`, error);
      // Continue processing other records even if one fails
    }
  }

  /**
   * MAIN PROCESSING ORCHESTRATOR
   * 
   * This is the core method that orchestrates the entire upload process.
   * Includes throttling and concurrency protection.
   * 
   * Flow:
   * 1. Check if already running (prevent concurrent executions)
   * 2. Check if enough time has passed since last attempt (throttling)
   * 3. Find all records needing upload across all models
   * 4. Process each record sequentially with small delays
   * 5. Clean up and mark as not running
   */
  private async processImageUploads(): Promise<void> {
    // Prevent concurrent executions
    if (this.isRunning) return;

    // Throttle upload attempts (avoid overwhelming server)
    const now = Date.now();
    if (now - this.lastUploadAttempt < MIN_TIME_BETWEEN_CHECKS) {
      return; // Not enough time has passed, skip this cycle
    }

    // Mark as running and update timestamp
    this.isRunning = true;
    this.lastUploadAttempt = now;
    console.log('🚀 Starting generic image upload service');

    try {
      // Step 1: Find all records across all models that need uploads
      const records = await this.findRecordsNeedingUpload();
      
      if (records.length === 0) {
        console.log('✅ No records need image uploads');
        return;
      }

      // Step 2: Process each record sequentially (avoid server overload)
      for (const record of records) {
        await this.processRecord(record);
        // Small delay between records to be nice to the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('✅ Generic image upload service completed');
    } catch (error) {
      console.error('❌ Error in generic image upload service:', error);
    } finally {
      // Always mark as not running, even if there was an error
      this.isRunning = false;
    }
  }

  // === PUBLIC API METHODS ===

  /**
   * START AUTOMATIC UPLOAD SERVICE
   * Starts the periodic upload service that checks for pending uploads every 30 seconds.
   * Safe to call multiple times - will not start duplicate timers.
   */
  public start(): void {
    if (this.intervalId) {
      console.log('⚠️ Generic image upload service already started');
      return;
    }

    console.log('🔄 Starting generic image upload service');
    
    // Run immediately on start
    this.processImageUploads();
    
    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.processImageUploads();
    }, RETRY_INTERVAL);
  }

  /**
   * STOP AUTOMATIC UPLOAD SERVICE
   * Stops the periodic upload service. Safe to call even if not running.
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Generic image upload service stopped');
    }
  }

  /**
   * MANUAL SINGLE RUN
   * Manually trigger a single upload cycle. Respects throttling rules.
   * Useful for testing or manual retry attempts.
   */
  public async runOnce(): Promise<void> {
    await this.processImageUploads();
  }

  /**
   * FORCE RUN (BYPASS THROTTLING)
   * Force immediate upload cycle, ignoring throttling rules.
   * Useful for manual triggers or focus events.
   */
  public async forceRun(): Promise<void> {
    if (this.isRunning) {
      console.log('⏸️ Upload service already running');
      return;
    }

    this.isRunning = true;
    this.lastUploadAttempt = Date.now();
    console.log('🚀 Force running image upload service');

    try {
      const records = await this.findRecordsNeedingUpload();
      
      if (records.length === 0) {
        console.log('✅ No records need image uploads');
        return;
      }

      for (const record of records) {
        await this.processRecord(record);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('✅ Force upload completed successfully');
    } catch (error) {
      console.error('❌ Error in force upload:', error);
    } finally {
      this.isRunning = false;
    }
  }
}

// === SERVICE EXPORTS ===

/**
 * SINGLETON SERVICE INSTANCE
 * Single instance ensures no conflicts between different parts of the app.
 */
export const genericImageUploadService = new GenericImageUploadService();

/**
 * CONVENIENCE FUNCTIONS
 * These wrapper functions provide a cleaner API for starting/stopping the service.
 */

// Start the automatic periodic upload service
export const startGenericImageUploadService = () => genericImageUploadService.start();

// Stop the automatic periodic upload service  
export const stopGenericImageUploadService = () => genericImageUploadService.stop();

// Manually trigger a single upload cycle
export const runGenericImageUploadServiceOnce = () => genericImageUploadService.runOnce();

// === LEGACY FUNCTION NAMES (for backward compatibility) ===

// Force run upload service immediately (bypasses throttling)
export const forceRunImageUploadService = () => genericImageUploadService.forceRun();

// Single run with throttling respect
export const runImageUploadServiceOnce = () => genericImageUploadService.runOnce();

// Get count of records pending upload (for UI display)
export const getUploadPendingCount = async (): Promise<number> => {
  try {
    const recordsToProcess = [];
    
    // Get all distinct models that have media files
    const modelsQuery = `
      SELECT DISTINCT model 
      FROM media_files 
      WHERE model IS NOT NULL
    `;
    
    const models = await powersync.getAll(modelsQuery) as { model: string }[];
    
    if (models.length === 0) {
      return 0;
    }

    // For each model, count records needing upload
    for (const { model } of models) {
      const mapping = MODEL_MAPPINGS[model];
      if (!mapping) continue;

      // Build query to find records missing URLs
      const urlFieldChecks = mapping.urlFields
        .map(field => `${field} IS NULL`)
        .join(' OR ');
      
      const whereClause = mapping.whereCondition 
        ? `WHERE ${mapping.whereCondition} AND (${urlFieldChecks})`
        : `WHERE ${urlFieldChecks}`;

      const targetTableQuery = `
        SELECT id, ${mapping.urlFields.join(', ')}
        FROM ${model}
        ${whereClause}
      `;

      const targetRecords = await powersync.getAll(targetTableQuery) as { id: string }[];
      
      // For each target record, check if it has mobile images
      for (const record of targetRecords) {
        const mediaQuery = `
          SELECT ${mapping.mobileFields.join(', ')}
          FROM media_files
          WHERE id = ? AND model = ?
        `;
        
        const mediaRecords = await powersync.getAll(mediaQuery, [record.id, model]) as any[];
        
        if (mediaRecords.length > 0) {
          const mediaRecord = mediaRecords[0];
          
          // Check if any mobile images exist for missing URLs
          const hasAnyImages = mapping.mobileFields.some(field => mediaRecord[field]);
          if (hasAnyImages) {
            recordsToProcess.push(record);
          }
        }
      }
    }

    return recordsToProcess.length;
  } catch (error) {
    console.error('Error getting upload pending count:', error);
    return 0;
  }
};