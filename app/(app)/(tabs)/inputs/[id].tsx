import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Modal, Image, Button, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft, X, Camera, MapPin, ChevronDown } from 'lucide-react-native';
import { powersync } from '@/powersync/system';
import * as Location from 'expo-location';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Crypto from 'expo-crypto';
import { useNetwork } from '@/NetworkContext';
import * as ImageManipulator from 'expo-image-manipulator';
interface Grower {
  id?: string;
  grower_id?: string;
  grower_number?: string;
  first_name?: string;
  surname?: string;
  fir?: string;
  b010_contract_scale?: string | number;
  production_scheme_id?: string;
  region_id?: string;
  distribution_plan?: string;
  grower_flags?: string;
  production_cycle_name?: string;
  [key: string]: any; 
}

export default function GrowerModal() {
  const { isConnected } = useNetwork()
  const { id, grower_id, production_scheme, pcr_id } = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [inputConfirmationLineData, setInputConfirmationLineData] = useState<any>(null);

  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [activeCamera, setActiveCamera] = useState<'grower_image' | 'grower_national_id' | 'grower_national_id_back' | null>(null);
  const [mobileGrowerImage, setMobileGrowerImage] = useState<string | null>(null);
  const [mobileGrowerNationalIdImage, setMobileGrowerNationalIdImage] = useState<string | null>(null);
  const [mobileGrowerNationalIdBackImage, setMobileGrowerNationalIdBackImage] = useState<string | null>(null);
  const [mobileGrowerImageEncoded, setMobileGrowerImageEncoded] = useState<string | null>(null);
  const [mobileGrowerNationalIdImageEncoded, setMobileGrowerNationalIdImageEncoded] = useState<string | null>(null);
  const [mobileGrowerNationalIdBackImageEncoded, setMobileGrowerNationalIdBackImageEncoded] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [showConfirmationPopup, setShowConfirmationPopup] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [inputConfirmationLineDataArray, setInputConfirmationLineDataArray] = useState<any[]>([]);
  const [currentInputConfirmationLineData, setCurrentInputConfirmationLineData] = useState<any>(null);
  const [collectionVouchers, setCollectionVouchers] = useState<any[]>([]);
  const [selectedCollectionVoucher, setSelectedCollectionVoucher] = useState<string>('');
  const [showVoucherDropdown, setShowVoucherDropdown] = useState<boolean>(false);
  const [config, setConfig] = useState<string | null>(null);
  // Return modal states
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [returnAll, setReturnAll] = useState<boolean>(true);
  const [returnHectares, setReturnHectares] = useState<string>('');
  const [originalHectares, setOriginalHectares] = useState<number>(0);
  const [currentReturnItem, setCurrentReturnItem] = useState<any>(null);


  const cameraRef = useRef<CameraView>(null);
  const UUID = Crypto.randomUUID();

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Load cached images for a grower if available for today
  const loadGrowerImages = async (growerNumber: string) => {
    try {
      const today = getTodayDate();
      console.log('🔍 Looking for cached images for grower:', growerNumber, 'on date:', today);
      
      const result = await powersync.getAll(
        `SELECT * FROM grower_daily_images WHERE grower_number = ? AND capture_date = ?`,
        [growerNumber, today]
      );

      console.log('📦 Query result:', result.length, 'records found');

      if (result.length > 0) {
        const cached = result[0] as any;
        console.log('✅ Found cached images for grower:', growerNumber);
        console.log('   - Has grower_image:', !!cached.grower_image);
        console.log('   - Has grower_id_image:', !!cached.grower_id_image);
        console.log('   - Has grower_id_back_image:', !!cached.grower_id_back_image);
        
        if (cached.grower_image) {
          setMobileGrowerImage(`data:image/jpg;base64,${cached.grower_image}`);
          setMobileGrowerImageEncoded(cached.grower_image);
          console.log('   - Loaded grower_image');
        }
        
        if (cached.grower_id_image) {
          setMobileGrowerNationalIdImage(`data:image/jpg;base64,${cached.grower_id_image}`);
          setMobileGrowerNationalIdImageEncoded(cached.grower_id_image);
          console.log('   - Loaded grower_id_image');
        }
        
        if (cached.grower_id_back_image) {
          setMobileGrowerNationalIdBackImage(`data:image/jpg;base64,${cached.grower_id_back_image}`);
          setMobileGrowerNationalIdBackImageEncoded(cached.grower_id_back_image);
          console.log('   - Loaded grower_id_back_image');
        }
        
        return true;
      }
      console.log('❌ No cached images found for grower:', growerNumber);
      return false;
    } catch (error) {
      console.error('💥 Error loading cached images:', error);
      return false;
    }
  };

  // Save images to cache for a grower
  const saveGrowerImages = async (growerNumber: string, growerImage: string, growerIdImage: string, growerIdBackImage: string) => {
    try {
      const today = getTodayDate();
      const id = Crypto.randomUUID();
      
      console.log('💾 Attempting to save images to cache:');
      console.log('   - Grower:', growerNumber);
      console.log('   - Date:', today);
      console.log('   - Grower image length:', growerImage?.length || 0);
      console.log('   - ID image length:', growerIdImage?.length || 0);
      console.log('   - ID back image length:', growerIdBackImage?.length || 0);
      
      // Delete existing cache for this grower today (if any)
      await powersync.execute(
        `DELETE FROM grower_daily_images WHERE grower_number = ? AND capture_date = ?`,
        [growerNumber, today]
      );
      
      // Insert new cache
      await powersync.execute(
        `INSERT INTO grower_daily_images (id, grower_number, grower_image, grower_id_image, grower_id_back_image, capture_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, growerNumber, growerImage, growerIdImage, growerIdBackImage, today, new Date().toISOString()]
      );
      
      console.log('✅ Successfully saved images to cache for grower:', growerNumber);
      
      // Verify the save by reading it back
      const verify = await powersync.getAll(
        `SELECT id, grower_number, capture_date FROM grower_daily_images WHERE grower_number = ? AND capture_date = ?`,
        [growerNumber, today]
      );
      console.log('🔍 Verification: Found', verify.length, 'records after save');
    } catch (error) {
      console.error('💥 Error saving images to cache:', error);
    }
  };

  // Clean up old images (older than today)
  const cleanupOldImages = async () => {
    try {
      const today = getTodayDate();
      console.log('🧹 Cleaning up images older than:', today);
      
      // First check what exists
      const beforeCleanup = await powersync.getAll(
        `SELECT COUNT(*) as count FROM grower_daily_images WHERE capture_date < ?`,
        [today]
      );
      console.log('   - Found', (beforeCleanup[0] as any)?.count || 0, 'old records to delete');
      
      await powersync.execute(
        `DELETE FROM grower_daily_images WHERE capture_date < ?`,
        [today]
      );
      
      console.log('✅ Cleaned up old cached images');
    } catch (error) {
      console.error('💥 Error cleaning up old images:', error);
    }
  };


  const getCollectionVouchers = async () => {
    try {
      const result = await powersync.getAll(`
        SELECT cv.id, cv.state, cv.driver_name, cv.driver_national_id, tr.name as truck_name, tr.reg_number
        FROM odoo_gms_collection_voucher cv
        LEFT JOIN odoo_gms_truck_reg tr ON cv.truck_id = tr.id
        ORDER BY cv.name
      `);

      //TODO: Filter out only ordered vouchers eg WHERE cv.state = 'ordered'
      // console.log('Collection Vouchers:', result);
      setCollectionVouchers(result);
    } catch (error) {
      console.error('Error fetching collection vouchers:', error);
    }
  };

  const getInputConfirmationLineData = async () => {
    console.log('Getting Input Confirmation Line Data for ID:', id);
    const query = `
      SELECT 
        icl.*,
        pcr.first_name,
        pcr.surname,
        pcr.grower_name,
        pcr.b010_contract_scale as contracted_hectares,
        pcr.production_cycle_name,
        ic.grv_number,
        ic.date_input,
        ic.state as confirmation_state,
        ip.name as input_pack_name,
        ip.code as input_pack_code,
        pg.name as product_group_name
      FROM odoo_gms_input_confirmations_lines icl
      LEFT JOIN odoo_gms_production_cycle_registration pcr 
        ON icl.production_cycle_registration_id = pcr.id
      LEFT JOIN odoo_gms_input_confirmations ic 
        ON icl.input_confirmations_id = ic.id
      LEFT JOIN odoo_gms_input_pack ip 
        ON ic.input_pack_id = ip.id
      LEFT JOIN odoo_gms_product_group pg
        ON icl.product_group_id = pg.id
      WHERE icl.production_cycle_registration_id = ?
    `;
          // WHERE icl.id = ?

    try {
      const result = await powersync.getAll(query, [pcr_id]);
      // console.log('Input Confirmation Line Data:', result);
      const inputConfirmationLineData = result[0] || null;
      const inputConfirmationLineDataArray = result as any;
      setInputConfirmationLineData(inputConfirmationLineData);
      setInputConfirmationLineDataArray(inputConfirmationLineDataArray);
    } catch (error) {
      console.error('Error fetching input confirmation line data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  useEffect(() => {
    requestPermission();
    getConfig();
    getInputConfirmationLineData();
    getCollectionVouchers();
    getCurrentLocation();
    cleanupOldImages(); // Clean up old cached images
  }, [id]);

  // Save images to cache when all three are captured
  useEffect(() => {
    const saveCachedImages = async () => {
      console.log('📸 Image capture useEffect triggered:');
      console.log('   - Has grower image?', !!mobileGrowerImageEncoded);
      console.log('   - Has ID image?', !!mobileGrowerNationalIdImageEncoded);
      console.log('   - Has ID back image?', !!mobileGrowerNationalIdBackImageEncoded);
      console.log('   - Has current data?', !!currentInputConfirmationLineData);
      
      if (mobileGrowerImageEncoded && mobileGrowerNationalIdImageEncoded && mobileGrowerNationalIdBackImageEncoded && currentInputConfirmationLineData) {
        try {
          console.log('🔍 Getting grower_number for PCR ID:', currentInputConfirmationLineData.production_cycle_registration_id);
          
          // Get grower_number
          const growerData = await powersync.getAll(
            `SELECT g.grower_number 
             FROM odoo_gms_production_cycle_registration pcr
             LEFT JOIN odoo_gms_grower g ON CAST(pcr.grower_id AS TEXT) = g.id
             WHERE pcr.id = ?`,
            [currentInputConfirmationLineData.production_cycle_registration_id]
          );
          
          console.log('📋 Grower data query returned:', growerData.length, 'records');
          
          if (growerData.length > 0 && (growerData[0] as any).grower_number) {
            const growerNumber = (growerData[0] as any).grower_number;
            console.log('👤 Found grower_number:', growerNumber);
            await saveGrowerImages(growerNumber, mobileGrowerImageEncoded, mobileGrowerNationalIdImageEncoded, mobileGrowerNationalIdBackImageEncoded);
          } else {
            console.log('❌ No grower_number found in query result');
          }
        } catch (error) {
          console.error('💥 Error in save cached images useEffect:', error);
        }
      } else {
        console.log('⏭️ Skipping save - not all conditions met');
      }
    };
    
    saveCachedImages();
  }, [mobileGrowerImageEncoded, mobileGrowerNationalIdImageEncoded, mobileGrowerNationalIdBackImageEncoded]);

  const getConfig = async () => {
    const result = await powersync.getAll(`
      SELECT * FROM ir_config_parameter WHERE key = 'app_config'
    `);
    console.log('Config:', result);
    // Only save the value field from the config
    const configValue = result.length > 0 ? (result[0] as any).value : null;
    setConfig(configValue);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for confirmation.');
        return;
      }

      const location = await Location.getCurrentPositionAsync();
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
      // console.log('Current location:', location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get current location');
    }
  };

  const compressImage = async (base64Image: string, imageType: 'grower_image' | 'grower_national_id' | 'grower_national_id_back'): Promise<string> => {
    try {
      const imageUri = base64Image.startsWith('data:image')
        ? base64Image
        : `data:image/jpg;base64,${base64Image}`;

      // TODO: Upgrade package to latest version
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1200 } }
        ],
        {
          compress: 0.35,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );

      // Log size comparison for debugging
      const originalSize = base64Image.length;
      const compressedSize = (manipulatedImage.base64 || '').length;
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      console.log(`${imageType} image compressed: ${originalSize} → ${compressedSize} bytes (${reduction}% reduction)`);

      return manipulatedImage.base64 || '';
    } catch (error) {
      console.error(`Error compressing ${imageType} image:`, error);
      return base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-[#65435C]">
        <Text className="text-white mb-4">We need camera permission for delivery confirmation</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!showCamera || !cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });

      if (photo?.base64) {
        const base64Data = photo.base64;
        
        const fixBase64Padding = (str: string) => {
          const cleanStr = str.replace(/=/g, "");
          const missingPadding = cleanStr.length % 4;
          return missingPadding ? cleanStr + '='.repeat(4 - missingPadding) : cleanStr;
        };
        
        const paddedBase64 = fixBase64Padding(base64Data);
        
        const imageType = activeCamera === 'grower_image' ? 'grower_image' : 
                          activeCamera === 'grower_national_id' ? 'grower_national_id' : 'grower_national_id_back';
        const compressedBase64 = await compressImage(paddedBase64, imageType);
        
        if (activeCamera === 'grower_image') {
          setMobileGrowerImage(`data:image/jpg;base64,${compressedBase64}`);
          setMobileGrowerImageEncoded(compressedBase64);
        } else if (activeCamera === 'grower_national_id') {
          setMobileGrowerNationalIdImage(`data:image/jpg;base64,${compressedBase64}`);
          setMobileGrowerNationalIdImageEncoded(compressedBase64);
        } else if (activeCamera === 'grower_national_id_back') {
          setMobileGrowerNationalIdBackImage(`data:image/jpg;base64,${compressedBase64}`);
          setMobileGrowerNationalIdBackImageEncoded(compressedBase64);
        }
      }
      
      setShowCamera(false);
      setActiveCamera(null);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const openCamera = (type: 'grower_image' | 'grower_national_id' | 'grower_national_id_back') => {
    setActiveCamera(type);
    setShowCamera(true);
  };

  const showConfirmationModal = async (item: any) => {
    console.log('🎯 Opening confirmation modal for PCR ID:', item.production_cycle_registration_id);
    
    setCurrentInputConfirmationLineData(item);
    // Reset form when opening modal
    setSelectedCollectionVoucher('');
    setShowVoucherDropdown(false);
    
    // Try to load cached images for this grower FIRST
    let imagesLoaded = false;
    try {
      // Get grower_number from production_cycle_registration
      console.log('🔍 Querying grower_number for PCR ID:', item.production_cycle_registration_id);
      
      const growerData = await powersync.getAll(
        `SELECT g.grower_number 
         FROM odoo_gms_production_cycle_registration pcr
         LEFT JOIN odoo_gms_grower g ON CAST(pcr.grower_id AS TEXT) = g.id
         WHERE pcr.id = ?`,
        [item.production_cycle_registration_id]
      );
      
      console.log('📋 Grower query returned:', growerData.length, 'records');
      
      if (growerData.length > 0 && (growerData[0] as any).grower_number) {
        const growerNumber = (growerData[0] as any).grower_number;
        console.log('👤 Found grower_number:', growerNumber, '- attempting to load cached images...');
        imagesLoaded = await loadGrowerImages(growerNumber);
        console.log('📷 Images loaded from cache?', imagesLoaded);
      } else {
        console.log('❌ No grower_number found');
      }
    } catch (error) {
      console.error('💥 Error loading grower number or cached images:', error);
    }
    
    // Only reset images if none were loaded from cache
    if (!imagesLoaded) {
      console.log('🔄 Resetting images (no cache found)');
      setMobileGrowerImage(null);
      setMobileGrowerNationalIdImage(null);
      setMobileGrowerNationalIdBackImage(null);
      setMobileGrowerImageEncoded(null);
      setMobileGrowerNationalIdImageEncoded(null);
      setMobileGrowerNationalIdBackImageEncoded(null);
    }
    
    // Open modal after images are loaded
    console.log('✅ Opening modal popup');
    setShowConfirmationPopup(true);
  };

  const showReturnModalHandler = (item: any) => {
    setCurrentReturnItem(item);
    const hectares = parseFloat(item.excel_hectares || 0);
    setOriginalHectares(hectares);
    setReturnHectares(hectares.toString());
    setReturnAll(true);
    setShowReturnModal(true);
  };

  const isValidHectares = (value: string): { valid: boolean; error?: string } => {
    const num = parseFloat(value);
    
    if (isNaN(num)) {
      return { valid: false, error: 'Please enter a valid number' };
    }
    
    if (num <= 0) {
      return { valid: false, error: 'Value must be greater than 0' };
    }
    
    if (num > originalHectares) {
      return { valid: false, error: `Value cannot exceed ${originalHectares} hectares` };
    }
    
    // Check if it's a whole number or ends in .5
    const isValid = num % 1 === 0 || num % 1 === 0.5;
    if (!isValid) {
      return { valid: false, error: 'Value must be a whole number or end in .5 (e.g., 1, 1.5, 2)' };
    }
    
    return { valid: true };
  };

  const updateInputIssue = async (item: any) => {

    if (config && JSON.parse(config.replace(/,(\s*[}\]])/g, '$1')).inputs_confirmation == 'images') {
        if (!mobileGrowerImage || !mobileGrowerNationalIdImage || !mobileGrowerNationalIdBackImage) {
          Alert.alert('Missing Images', 'Please capture all three images (grower photo, national ID front, and national ID back) before confirming.');
          return;
        }
    } else if (!latitude || !longitude) {
      Alert.alert('Missing Location', 'Please capture the location before confirming.');
      return;
    } else if (!selectedCollectionVoucher) {
      Alert.alert('Missing Collection Voucher', 'Please select a collection voucher before confirming.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Starting confirmation process...');
      console.log('Item ID:', item.id);
      console.log('Has grower image:', !!mobileGrowerImageEncoded);
      console.log('Has national ID image:', !!mobileGrowerNationalIdImageEncoded);
      console.log('Has national ID back image:', !!mobileGrowerNationalIdBackImageEncoded);
      
      // Insert or replace images into media_files table (handles case where record already exists)
      console.log('Inserting/updating images in media_files table...');
      await powersync.execute(`
        INSERT OR REPLACE INTO media_files (id, mobile_grower_image, mobile_grower_national_id_image, mobile_grower_national_id_back_image, create_date, write_date, model)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [item.id, mobileGrowerImageEncoded, mobileGrowerNationalIdImageEncoded, mobileGrowerNationalIdBackImageEncoded, new Date().toISOString(), new Date().toISOString(), 'odoo_gms_input_confirmations_lines']);
      
      console.log('✅ Images inserted into media_files table successfully');

      // Update the input confirmation line with received state
      // Image URLs are set to NULL initially and will be populated by the image upload service
      console.log('Updating input confirmation line...');
      await powersync.execute(`
        UPDATE odoo_gms_input_confirmations_lines 
        SET issue_state = ?, latitude = ?, longitude = ?, voucher_id = ?, grower_image_url = NULL, grower_national_id_image_url = NULL, grower_national_id_back_image_url = NULL
        WHERE id = ?
      `, ['received', latitude, longitude, selectedCollectionVoucher, item.id]);

      console.log('✅ Database updated successfully');
      Alert.alert('Success', 'Input delivery confirmed successfully!');
      
      setShowConfirmationPopup(false);
      // Reset selection
      setSelectedCollectionVoucher('');
      setShowVoucherDropdown(false);
      setMobileGrowerImage(null);
      setMobileGrowerNationalIdImage(null);
      setMobileGrowerNationalIdBackImage(null);
      setMobileGrowerImageEncoded(null);
      setMobileGrowerNationalIdImageEncoded(null);
      setMobileGrowerNationalIdBackImageEncoded(null);
      
      console.log('✅ Confirmation process completed, navigating back...');
      router.back();
    } catch (error) {
      console.error('❌ Error in confirmation process:', error);
      Alert.alert('Error', `Failed to confirm delivery: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  const submitReturnInput = async () => {
    const item = currentReturnItem;
    
    // Validate if partial return
    if (!returnAll) {
      const validation = isValidHectares(returnHectares);
      if (!validation.valid) {
        Alert.alert('Invalid Input', validation.error);
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      console.log('Returning input with location');
      
      if (returnAll) {
        // Return all - same as before
        await powersync.execute(`
          UPDATE odoo_gms_input_confirmations_lines
          SET issue_state = ?, latitude = ?, longitude = ?
          WHERE id = ?
        `, ['returned', latitude, longitude, item.id]);
      } else {
        // Partial return - update excel_hectares
        const returnedAmount = parseFloat(returnHectares);
        const newIssuedHectares = originalHectares - returnedAmount;
        
        await powersync.execute(`
          UPDATE odoo_gms_input_confirmations_lines
          SET excel_hectares = ?, latitude = ?, longitude = ?
          WHERE id = ?
        `, [newIssuedHectares, latitude, longitude, item.id]);
      }

      Alert.alert('Success', 'Input returned successfully!');
      setShowReturnModal(false);
      router.back();
    } catch (error) {
      console.error('Error updating input issue:', error);
      Alert.alert('Error', `Failed to return input: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
 

  return (
    <SafeAreaView className="flex-1 bg-[#65435C]">
      <View className="flex-1 mt-6 ">
        <View className="flex-1 bg-white rounded-t-3xl overflow-hidden ">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100 ">
            <TouchableOpacity className="flex-row items-center" onPress={() => router.back()}>
              <ChevronLeft size={28} color="#65435C" />
            <Text className="text-xl font-bold text-[#65435C]">Input Details</Text>
            </TouchableOpacity>
            </View>
            {inputConfirmationLineData?.issue_state === 'issued' && (
            <View className="flex-row justify-between items-center p-4 border-b border-gray-100 ">


            <Text className="text-[#65435C] font-bold text-md text-left flex-1">
                      {inputConfirmationLineData?.input_pack_name || 'N/A'}
              </Text>
              <Text className="text-[#65435C] font-bold text-lg text-right flex-1 mr-2">
                      {inputConfirmationLineData?.production_cycle_name || 'N/A'}
              </Text>


              
          </View>
          )}
            <ScrollView className="flex-1 px-4 py-6">
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {/* Header with Grower Name */}
                <View className="flex-row items-center mb-6">
                  <View className="h-16 w-16 rounded-full bg-[#1AD3BB] items-center justify-center mr-4">
                    <Text className="text-white font-bold text-xl">
                      {inputConfirmationLineData?.first_name?.charAt(0)}{inputConfirmationLineData?.surname?.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-[#65435C]">
                      {inputConfirmationLineData?.first_name} {inputConfirmationLineData?.surname}
                    </Text>
                  </View>
                </View>

                {/* Hectares Cards */}
                {/* <View className="flex-row justify-between mb-6">
                  <View className="flex-1 bg-[#65435C]/10 rounded-xl p-4 mr-2">
                    <Text className="text-[#65435C] text-sm font-medium mb-1">Contracted Ha</Text>
                    <Text className="text-[#65435C] text-2xl font-bold">
                      {inputConfirmationLineData?.contracted_hectares || '0'}
                    </Text>
                  </View>
                  <View className="flex-1 bg-[#65435C]/10 rounded-xl p-4 ml-2">
                    <Text className="text-[#65435C] text-sm font-medium mb-1">Confirmed Ha</Text>
                    <Text className="text-[#65435C] text-2xl font-bold">
                      {inputConfirmationLineData?.excel_hectares || '0'}
                    </Text>
                  </View>
                </View> */}
              </View>

              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                {inputConfirmationLineDataArray.map((item: any, index: number) => (
                  <View className="" key={index}>
                    <View className="flex-row justify-between items-center pt-8 py-3 border-b border-gray-100">
                      <Text className="text-gray-900 text-md font-bold">{item.contracted_hectares || 0} Ha | Contracted</Text>
                      <Text className="text-gray-900 text-md font-bold">{item.excel_hectares || 0} Ha | Confirmed</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-3 border-b border-[#65435C]">
                    <View className="w-1/2">
                      <Text className="text-gray-900 text-md font-bold">{item.issued_packs} * {item.product_group_name}</Text>
                    </View>
                     
                     <View className="w-1/2">
                     {item.issue_state === 'issued' ? (
                       <View className="flex-row justify-between items-center py-3 border-b border-gray-100 gap-2.5" >
                         <TouchableOpacity 
                           className="h-8 w-24 rounded-lg bg-[#1AD3BB] items-center justify-center flex-row gap-0.5"
                           onPress={() => showConfirmationModal(item)}
                           >
                             <Text className="text-white text-xs">RECEIVE</Text>
                         </TouchableOpacity>
                         <TouchableOpacity 
                           className="h-8 w-24 rounded-lg bg-red-500 items-center justify-center flex-row gap-0.5"
                           onPress={() => showReturnModalHandler(item)}
                           >
                             <Text className="text-white text-xs">RETURN</Text>
                         </TouchableOpacity>
                       </View>
                     ) : (
                       <View className={`px-3 py-1 rounded-lg ${
                         item.issue_state === 'received' ? 'bg-yellow-100' : 
                         item.issue_state === 'returned' ? 'bg-green-100' : 'bg-gray-100'
                       }`}>
                         <Text className={`text-sm font-medium ${
                           item.issue_state === 'received' ? 'text-yellow-800' : 
                           item.issue_state === 'returned' ? 'text-green-800' : 'text-gray-800'
                         }`}>
                           {item.issue_state?.toUpperCase() || 'Unknown'}
                         </Text>
                       </View>
                     )}
                     </View>
                     </View>
                   </View>

                 ))}
               
               </View>

            </ScrollView>

            {/* Camera Modal */}
            <Modal visible={showCamera} animationType="slide">
              <View className="flex-1">
                <CameraView 
                  ref={cameraRef}
                  style={{flex: 1}} 
                  facing={facing}
                >
                  <View className="flex-1 justify-between p-4">
                    <View className="flex-row justify-between">
                      <TouchableOpacity 
                        className="bg-white p-2 rounded-full" 
                        onPress={toggleCameraFacing}
                      >
                        <Camera size={24} color="#65435C" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="bg-white p-2 rounded-full" 
                        onPress={() => setShowCamera(false)}
                      >
                        <X size={24} color="#65435C" />
                      </TouchableOpacity>
                    </View>
                    <View className="items-center mb-10">
                      <TouchableOpacity 
                        className="bg-white p-4 rounded-full" 
                        onPress={takePicture}
                      >
                        <View className="bg-[#65435C] h-12 w-12 rounded-full" />
                      </TouchableOpacity>
                      <Text className="text-white mt-2 text-center">
                        {activeCamera === 'grower_image' ? 'Capture Grower Photo' : 
                         activeCamera === 'grower_national_id' ? 'Capture National ID Front' : 'Capture National ID Back'}
                      </Text>
                    </View>
                  </View>
                </CameraView>
              </View>
            </Modal>

            {/* Confirmation Popup Modal */}
            <Modal 
              visible={showConfirmationPopup} 
              animationType="slide" 
              presentationStyle="pageSheet"
            >
              <SafeAreaView className="flex-1 bg-[#65435C]">
                <View className="flex-1 mt-6">
                  <View className="flex-1 bg-white rounded-t-3xl overflow-hidden">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                      <Text className="text-xl font-bold text-[#65435C]">Confirm Delivery</Text>
                      <TouchableOpacity onPress={() => setShowConfirmationPopup(false)}>
                        <X size={24} color="#65435C" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-4">
                      {/* Location Display */}
                      <View className="bg-gray-50 rounded-xl p-4 mb-4">
                        <View className="flex-row items-center mb-2">
                          <MapPin size={20} color="#65435C" />
                          <Text className="text-[#65435C] font-semibold ml-2">Current Location</Text>
                        </View>
                        <Text className="text-gray-600 text-sm">
                          Latitude: {latitude || 'Getting location...'}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          Longitude: {longitude || 'Getting location...'}
                        </Text>
                      </View>

                      {config && JSON.parse(config.replace(/,(\s*[}\]])/g, '$1')).inputs_confirmation == 'images' && (
                      <View className="mb-6">
                        <View className="flex-row justify-between mb-4">
                          <TouchableOpacity 
                            className="bg-white border border-gray-300 rounded-lg p-2 w-[48%] h-40"
                            onPress={() => openCamera('grower_image')}
                          >
                            {mobileGrowerImage ? (
                              <Image 
                                source={{ uri: mobileGrowerImage }} 
                                className="w-full h-full rounded-lg" 
                                resizeMode="cover"
                              />
                            ) : (
                              <View className="items-center justify-center h-full">
                                <Camera size={40} color="#65435C" />
                                <Text className="text-gray-600 mt-2 text-center">Grower Photo</Text>
                                <Text className="text-gray-400 text-xs text-center mt-1">Tap to capture</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            className="bg-white border border-gray-300 rounded-lg p-2 w-[48%] h-40"
                            onPress={() => openCamera('grower_national_id')}
                          >
                            {mobileGrowerNationalIdImage ? (
                              <Image 
                                source={{ uri: mobileGrowerNationalIdImage }} 
                                className="w-full h-full rounded-lg" 
                                resizeMode="cover"
                              />
                            ) : (
                              <View className="items-center justify-center h-full">
                                <Camera size={40} color="#65435C" />
                                <Text className="text-gray-600 mt-2 text-center">National ID Front</Text>
                                <Text className="text-gray-400 text-xs text-center mt-1">Tap to capture</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                        
                        <View className="flex-row justify-center">
                          <TouchableOpacity 
                            className="bg-white border border-gray-300 rounded-lg p-2 w-[48%] h-40"
                            onPress={() => openCamera('grower_national_id_back')}
                          >
                            {mobileGrowerNationalIdBackImage ? (
                              <Image 
                                source={{ uri: mobileGrowerNationalIdBackImage }} 
                                className="w-full h-full rounded-lg" 
                                resizeMode="cover"
                              />
                            ) : (
                              <View className="items-center justify-center h-full">
                                <Camera size={40} color="#65435C" />
                                <Text className="text-gray-600 mt-2 text-center">National ID Back</Text>
                                <Text className="text-gray-400 text-xs text-center mt-1">Tap to capture</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                      )}

                       {config && JSON.parse(config.replace(/,(\s*[}\]])/g, '$1')).inputs_confirmation == 'signature' && (
                  <TouchableOpacity 
                         className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-300 items-center justify-center"
                         onPress={() => router.push({
                          pathname: '/inputs/signature',
                          params: {
                            id: currentInputConfirmationLineData?.id,
                            name: currentInputConfirmationLineData?.first_name + ' ' + currentInputConfirmationLineData?.surname,
                            input_pack_name: currentInputConfirmationLineData?.product_group_name,
                            uuid: UUID
                          }
                        })}
                       >
                         <Text className="text-[#65435C] font-semibold mb-2 text-xl text-uppercase"> Grower Signature</Text>
                       </TouchableOpacity>
                      )}

                      {/* Collection Voucher Select */}
                      <View className="bg-gray-50 rounded-xl p-4 mb-6">
                        <Text className="text-[#65435C] font-semibold mb-2">Select Collection Voucher</Text>
                        <View className="relative">
                          {/* Selected Item Display */}
                          <TouchableOpacity 
                            className="bg-white border border-gray-300 rounded-lg p-3 flex-row justify-between items-center"
                            onPress={() => setShowVoucherDropdown(!showVoucherDropdown)}
                          >
                            <View className="flex-1">
                              {selectedCollectionVoucher ? (
                                <View>
                                  {(() => {
                                    const selectedVoucher = collectionVouchers.find(v => v.id === selectedCollectionVoucher);
                                    return selectedVoucher ? (
                                      <View>
                                        <Text className="text-gray-900 font-medium">
                                          {selectedVoucher.truck_name} -- {selectedVoucher.reg_number} ({selectedVoucher.driver_name} - {selectedVoucher.driver_national_id})
                                        </Text>
                                        <Text className="text-gray-500 text-xs mt-1">
                                          Name: {selectedVoucher.truck_name} | ID: {selectedVoucher.id}
                                        </Text>
                                      </View>
                                    ) : null;
                                  })()}
                                </View>
                              ) : (
                                <Text className="text-gray-500">Select a collection voucher...</Text>
                              )}
                            </View>
                            <ChevronDown size={20} color="#65435C" />
                          </TouchableOpacity>

                          {/* Dropdown List */}
                          {showVoucherDropdown && (
                            <View className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-300 rounded-lg mt-1 max-h-60">
                              <ScrollView>
                                {collectionVouchers.map((voucher) => (
                                  <TouchableOpacity 
                                    key={voucher.id}
                                    className="p-3 border-b border-gray-100"
                                    onPress={() => {
                                      setSelectedCollectionVoucher(voucher.id);
                                      setShowVoucherDropdown(false);
                                    }}
                                  >
                                    <Text className="text-gray-900 font-medium">
                                      {voucher.truck_name} -- {voucher.reg_number} ({voucher.driver_name} - {voucher.driver_national_id})
                                    </Text>
                                    <Text className="text-gray-500 text-xs mt-1">
                                      Name: {voucher.truck_name} | ID: {voucher.id}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      </View>



                      {/* Grower Info Summary */}
                      <View className="bg-gray-50 rounded-xl p-4 mb-6">
                        <Text className="text-[#65435C] font-semibold mb-2">Delivery Summary</Text>
                        <Text className="text-gray-600">
                          Grower: {currentInputConfirmationLineData?.first_name} {currentInputConfirmationLineData?.surname}
                        </Text>
                        <Text className="text-gray-600">
                          Input Pack: {currentInputConfirmationLineData?.product_group_name}
                        </Text>
                        <Text className="text-gray-600">
                          Issued Packs: {currentInputConfirmationLineData?.issued_packs}
                        </Text>
                        <Text className="text-gray-600">
                          Hectares: {currentInputConfirmationLineData?.excel_hectares || '0'} Ha
                        </Text>
                      </View>

                      {/* Confirm Button */}
                      {/* <TouchableOpacity 
                        className={`rounded-xl p-4 ${
                          mobileGrowerImage && mobileGrowerNationalIdImage && selectedCollectionVoucher && !isSubmitting 
                            ? 'bg-[#65435C]' 
                            : 'bg-gray-300'
                        }`}
                        onPress={() => updateInputIssue(currentInputConfirmationLineData)}
                        disabled={!mobileGrowerImage || !mobileGrowerNationalIdImage || !selectedCollectionVoucher || isSubmitting}
                      >
                        <Text className={`text-center font-semibold text-lg ${
                          mobileGrowerImage && mobileGrowerNationalIdImage && selectedCollectionVoucher && !isSubmitting 
                            ? 'text-white' 
                            : 'text-gray-500'
                        }`}>
                          {isSubmitting ? 'Uploading & Confirming...' : 'Confirm Delivery'}
                        </Text>
                      </TouchableOpacity> */}
                       <TouchableOpacity 
                        className={`rounded-xl p-4 ${
                          !isSubmitting 
                            ? 'bg-[#65435C]' 
                            : 'bg-gray-300'
                        }`}
                        onPress={() => updateInputIssue(currentInputConfirmationLineData)}
                        disabled={isSubmitting}
                      >
                        <Text className={`text-center font-semibold text-lg ${
                          !isSubmitting 
                            ? 'text-white' 
                            : 'text-gray-500'
                        }`}>
                          {isSubmitting ? 'Uploading & Confirming...' : 'Confirm Delivery'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        className="mt-3 p-4"
                        onPress={() => setShowConfirmationPopup(false)}
                      >
                        <Text className="text-center text-gray-500">Cancel</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                </View>
              </SafeAreaView>
            </Modal>

            {/* Return Modal */}
            <Modal 
              visible={showReturnModal} 
              animationType="slide" 
              presentationStyle="pageSheet"
            >
              <SafeAreaView className="flex-1 bg-[#65435C]">
                <View className="flex-1 mt-6">
                  <View className="flex-1 bg-white rounded-t-3xl overflow-hidden">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                      <Text className="text-xl font-bold text-[#65435C]">Return Input</Text>
                      <TouchableOpacity onPress={() => setShowReturnModal(false)}>
                        <X size={24} color="#65435C" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-4">
                      {/* Grower Info */}
                      <View className="bg-gray-50 rounded-xl p-4 mb-4">
                        <Text className="text-[#65435C] font-semibold mb-2">Grower Information</Text>
                        <Text className="text-gray-600">
                          Name: {currentReturnItem?.first_name} {currentReturnItem?.surname}
                        </Text>
                        <Text className="text-gray-600">
                          Input Pack: {currentReturnItem?.product_group_name}
                        </Text>
                        <Text className="text-gray-600">
                          Original Hectares: {originalHectares} Ha
                        </Text>
                      </View>

                      {/* Return All Checkbox */}
                      <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                        <TouchableOpacity 
                          className="flex-row items-center"
                          onPress={() => {
                            setReturnAll(!returnAll);
                            if (!returnAll) {
                              setReturnHectares(originalHectares.toString());
                            }
                          }}
                        >
                          <View className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                            returnAll ? 'bg-[#65435C] border-[#65435C]' : 'border-gray-400'
                          }`}>
                            {returnAll && <Text className="text-white font-bold">✓</Text>}
                          </View>
                          <Text className="text-[#65435C] font-semibold text-lg">Return All</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Hectares Input */}
                      <View className="bg-gray-50 rounded-xl p-4 mb-4">
                        <Text className="text-[#65435C] font-semibold mb-2">
                          Hectares to Return
                        </Text>
                        <TextInput
                          className={`bg-white border border-gray-300 rounded-lg p-3 text-[#65435C] text-lg ${
                            returnAll ? 'opacity-50' : ''
                          }`}
                          value={returnHectares}
                          onChangeText={setReturnHectares}
                          keyboardType="decimal-pad"
                          editable={!returnAll}
                          placeholder="Enter hectares"
                        />
                        <Text className="text-gray-500 text-xs mt-2">
                          Must be a whole number or end in .5 (e.g., 1, 1.5, 2)
                        </Text>
                      </View>

                      {/* Location Display */}
                      <View className="bg-gray-50 rounded-xl p-4 mb-6">
                        <View className="flex-row items-center mb-2">
                          <MapPin size={20} color="#65435C" />
                          <Text className="text-[#65435C] font-semibold ml-2">Current Location</Text>
                        </View>
                        <Text className="text-gray-600 text-sm">
                          Latitude: {latitude || 'Getting location...'}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          Longitude: {longitude || 'Getting location...'}
                        </Text>
                      </View>

                      {/* Submit Button */}
                      <TouchableOpacity 
                        className={`rounded-xl p-4 ${
                          !isSubmitting ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                        onPress={submitReturnInput}
                        disabled={isSubmitting}
                      >
                        <Text className={`text-center font-semibold text-lg ${
                          !isSubmitting ? 'text-white' : 'text-gray-500'
                        }`}>
                          {isSubmitting ? 'Processing...' : 'Confirm Return'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        className="mt-3 p-4"
                        onPress={() => setShowReturnModal(false)}
                      >
                        <Text className="text-center text-gray-500">Cancel</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                </View>
              </SafeAreaView>
            </Modal>
        </View>
      </View>
    </SafeAreaView>
  );
}




























