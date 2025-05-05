import { PowerSyncDatabase } from '@powersync/react-native';
import { Connector } from './Connector';
import { AppSchema } from './Schema';

export const powersync = new PowerSyncDatabase({
    // The schema you defined in the previous step
    schema: AppSchema,
    // For other options see,
    // https://powersync-ja.github.io/powersync-js/web-sdk/globals#powersyncopenfactoryoptions
    database: {
        // Filename for the SQLite database — it's important to only instantiate one instance per file.
        // For other database options see,
        // https://powersync-ja.github.io/powersync-js/web-sdk/globals#sqlopenoptions
        dbFilename: 'powersync.db'
    }
});


export const setupPowerSync = async (clientId?: number) => {
  // Uses the backend connector that will be created in the next section
  const connector = new Connector();
  
  // Connect with options including clientId if provided
  powersync.connect(connector, { 
    // clientId: clientId, // Will be undefined if not provided
    // You can also add client parameters here if needed
    params: {
      clientUserId: 148
    }
  });
};