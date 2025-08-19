import { powersync } from '@/powersync/system';
import axios from 'axios';

/**
 * Image Upload Retry Service
 * Runs every 15 minutes to upload images that failed during initial confirmation
 */

const IMAGE_UPLOAD_SERVER = 'http://128.199.51.123/api/upload/';
const RETRY_INTERVAL = 3 * 60 * 1000; // 15 minutes in milliseconds

interface ImageUploadRecord {
  id: string;
  mobile_grower_image: string | null;
  mobile_grower_national_id_image: string | null;
  grower_image_url: string | null;
  grower_national_id_image_url: string | null;
}

class ImageUploadService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Upload grower image to server
   */
  private async sendGrowerImageToServer(mobileGrowerImageEncoded: string): Promise<string> {
    console.log('🔄 Retrying grower image upload to server');

    try {
      const options = {
        method: 'POST',
        url: IMAGE_UPLOAD_SERVER,
        headers: {'Content-Type': 'application/json'},
        // timeout: 30000, // 30 second timeout
        data: {
          image: mobileGrowerImageEncoded,
        }
      };
      
      const response = await axios.request(options);
      console.log('✅ Grower image upload response:', response.data);
      
      if (response.data.error) {
        console.error('❌ Server error uploading grower image:', response.data.error);
        throw new Error(response.data.error);
      }
      
      if (!response.data.url) {
        throw new Error('Server did not return image URL');
      }
      
      return response.data.url;
    } catch (error) {
      console.error('❌ Error uploading grower image:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Image upload timed out. Please check your internet connection and try again.');
        } else if (error.response) {
          throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        } else if (error.request) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
      }
      throw new Error('Failed to upload grower image. Please try again.');
    }
  }

  /**
   * Upload grower national ID image to server
   */
  private async sendGrowerNationalIdImageToServer(mobileGrowerNationalIdImageEncoded: string): Promise<string> {
    console.log('🔄 Retrying grower national ID image upload to server');

    try {
      const options = {
        method: 'POST',
        url: IMAGE_UPLOAD_SERVER,
        headers: {'Content-Type': 'application/json'},
        // timeout: 30000, // 30 second timeout
        data: {
          image: mobileGrowerNationalIdImageEncoded,
        }
      };

      const response = await axios.request(options);
      console.log('✅ National ID image upload response:', response.data);

      if (response.data.error) {
        console.error('❌ Server error uploading national ID image:', response.data.error);
        throw new Error(response.data.error);
      }

      if (!response.data.url) {
        throw new Error('Server did not return image URL');
      }

      return response.data.url;
    } catch (error) {
      console.error('❌ Error uploading national ID image:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('National ID image upload timed out. Please check your internet connection and try again.');
        } else if (error.response) {
          throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        } else if (error.request) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
      }
      throw new Error('Failed to upload national ID image. Please try again.');
    }
  }

  /**
   * Find records that need image uploads
   */
  private async findRecordsNeedingUpload(): Promise<ImageUploadRecord[]> {
    try {
      // First, find records from odoo_gms_input_confirmations_lines with missing image URLs
      const confirmationLinesQuery = `
        SELECT id, grower_image_url, grower_national_id_image_url
        FROM odoo_gms_input_confirmations_lines
        WHERE issue_state = 'received'
        AND (grower_image_url IS NULL OR grower_national_id_image_url IS NULL)
      `;

      interface ConfirmationRecord {
        id: string;
        grower_image_url: string | null;
        grower_national_id_image_url: string | null;
      }

      interface MediaRecord {
        mobile_grower_image: string | null;
        mobile_grower_national_id_image: string | null;
      }

      const confirmationRecords = await powersync.getAll(confirmationLinesQuery) as ConfirmationRecord[];
      console.log(`📋 Found ${confirmationRecords.length} confirmation records with missing image URLs`);

      if (confirmationRecords.length === 0) {
        return [];
      }

      // For each confirmation record, get the corresponding mobile images from media_files table
      const imageUploadRecords: ImageUploadRecord[] = [];
      
      console.log('🔄 Starting to process confirmation records...');
      for (let i = 0; i < confirmationRecords.length; i++) {
        const record = confirmationRecords[i];
        console.log(`🔍 Processing confirmation record ${i + 1}/${confirmationRecords.length}: ${record.id}`);
        try {
          const mediaQuery = `
            SELECT mobile_grower_image, mobile_grower_national_id_image
            FROM media_files
            WHERE id = ?
          `;
          
          console.log(`📊 Querying media_files for record: ${record.id}`);
          const mediaRecords = await powersync.getAll(mediaQuery, [record.id]) as MediaRecord[];
          console.log(`🔍 Found ${mediaRecords.length} media records for ${record.id}`);
          
          if (mediaRecords.length > 0) {
            const mediaRecord = mediaRecords[0];
            
            // Only include if there are mobile images to upload for missing URLs
            const needsGrowerImageUpload = !record.grower_image_url && mediaRecord.mobile_grower_image;
            const needsNationalIdUpload = !record.grower_national_id_image_url && mediaRecord.mobile_grower_national_id_image;
            
            console.log(`🔍 Record ${record.id} analysis:`, {
              grower_image_url: record.grower_image_url,
              grower_national_id_image_url: record.grower_national_id_image_url,
              has_mobile_grower_image: !!mediaRecord.mobile_grower_image,
              has_mobile_national_id_image: !!mediaRecord.mobile_grower_national_id_image,
              needsGrowerImageUpload,
              needsNationalIdUpload
            });
            
            if (needsGrowerImageUpload || needsNationalIdUpload) {
              console.log(`✅ Adding record ${record.id} to upload queue`);
              imageUploadRecords.push({
                id: record.id,
                grower_image_url: record.grower_image_url,
                grower_national_id_image_url: record.grower_national_id_image_url,
                mobile_grower_image: mediaRecord.mobile_grower_image,
                mobile_grower_national_id_image: mediaRecord.mobile_grower_national_id_image
              });
            } else {
              console.log(`⏭️ Skipping record ${record.id} - no upload needed`);
            }
          } else {
            console.log(`⚠️ No media records found for ${record.id}`);
          }
        } catch (mediaError) {
          console.error(`❌ Error fetching media files for record ${record.id}:`, mediaError);
          // Continue with other records
        }
        console.log(`✅ Completed processing confirmation record: ${record.id}`);
      }
      
      console.log('🏁 Finished processing all confirmation records');

      console.log(`📋 Found ${imageUploadRecords.length} records needing image upload`);
      // Log record IDs only to avoid potential issues with large image data
      console.log('record IDs:', imageUploadRecords.map(r => r.id));

      console.log('🔄 About to return imageUploadRecords...');
      return imageUploadRecords;
    } catch (error) {
      console.error('❌ Error finding records needing upload:', error);
      return [];
    }
  }

  /**
   * Process a single record for image uploads
   */
  private async processRecord(record: ImageUploadRecord): Promise<void> {
    console.log(`🔄 Processing record ${record.id} for image uploads`);
    
    let growerImageUrl = record.grower_image_url;
    let growerNationalIdImageUrl = record.grower_national_id_image_url;
    let hasUpdates = false;

    try {
      // Upload grower image if URL is missing
      if (!growerImageUrl && record.mobile_grower_image) {
        console.log(`📤 Uploading grower image for record ${record.id}`);
        growerImageUrl = await this.sendGrowerImageToServer(record.mobile_grower_image);
        hasUpdates = true;
        console.log(`✅ Grower image uploaded successfully for record ${record.id}`);
      }

      // Upload national ID image if URL is missing
      if (!growerNationalIdImageUrl && record.mobile_grower_national_id_image) {
        console.log(`📤 Uploading national ID image for record ${record.id}`);
        growerNationalIdImageUrl = await this.sendGrowerNationalIdImageToServer(record.mobile_grower_national_id_image);
        hasUpdates = true;
        console.log(`✅ National ID image uploaded successfully for record ${record.id}`);
      }

      // Update database if we have new URLs
      if (hasUpdates) {
        await powersync.execute(`
          UPDATE odoo_gms_input_confirmations_lines 
          SET grower_image_url = ?, grower_national_id_image_url = ?
          WHERE id = ?
        `, [growerImageUrl, growerNationalIdImageUrl, record.id]);
        
        console.log(`✅ Database updated successfully for record ${record.id}`);
      }

    } catch (error) {
      console.error(`❌ Failed to process record ${record.id}:`, error);
      // Continue processing other records even if one fails
    }
  }

  /**
   * Main processing function - runs the retry logic
   */
  private async processImageUploads(): Promise<void> {
    if (this.isRunning) {
      console.log('⏸️ Image upload service already running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting image upload retry service');

    try {
      console.log('🔍 Calling findRecordsNeedingUpload...');
      const records = await this.findRecordsNeedingUpload();
      console.log('✅ findRecordsNeedingUpload completed, returned records:', records.length);
      
      if (records.length === 0) {
        console.log('✅ No records need image uploads');
        return;
      }

      console.log(`📊 Processing ${records.length} records for image uploads`);
      
      // Process records sequentially to avoid overwhelming the server
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        console.log(`🚀 Starting to process record ${i + 1}/${records.length}: ${record.id}`);
        await this.processRecord(record);
        console.log(`✅ Completed processing record ${i + 1}/${records.length}: ${record.id}`);
        // Small delay between records to be nice to the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('✅ Image upload retry service completed successfully');
      
    } catch (error) {
      console.error('❌ Error in image upload retry service:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the image upload retry service
   */
  public start(): void {
    if (this.intervalId) {
      console.log('⚠️ Image upload service already started');
      return;
    }

    console.log('🔄 Starting image upload retry service (runs every 15 minutes)');
    
    // Run immediately on start
    this.processImageUploads();
    
    // Then run every 15 minutes
    this.intervalId = setInterval(() => {
      this.processImageUploads();
    }, RETRY_INTERVAL);
  }

  /**
   * Stop the image upload retry service
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Image upload retry service stopped');
    }
  }

  /**
   * Manually trigger a single run (useful for testing)
   */
  public async runOnce(): Promise<void> {
    console.log('🔄 Manually triggering image upload retry service');
    await this.processImageUploads();
  }
}

// Export singleton instance
export const imageUploadService = new ImageUploadService();

// Auto-start the service when imported
export const startImageUploadService = () => {
  imageUploadService.start();
};

// Export for manual control
export const stopImageUploadService = () => {
  imageUploadService.stop();
};

export const runImageUploadServiceOnce = () => {
  return imageUploadService.runOnce();
};
