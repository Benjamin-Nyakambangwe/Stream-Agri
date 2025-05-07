import { AbstractPowerSyncDatabase, PowerSyncBackendConnector, UpdateType } from "@powersync/react-native";
import * as SecureStore from 'expo-secure-store';
export class Connector implements PowerSyncBackendConnector {
  /**
  * Implement fetchCredentials to obtain a JWT from your authentication service.
  * See https://docs.powersync.com/installation/authentication-setup
  * If you're using Supabase or Firebase, you can re-use the JWT from those clients, see:
  * https://docs.powersync.com/installation/authentication-setup/supabase-auth
  * https://docs.powersync.com/installation/authentication-setup/firebase-auth
  */
  async fetchCredentials() {
    const powerSyncURI = await SecureStore.getItemAsync('power_sync_uri')
    
    // If powerSyncURI is null, return null or use a default endpoint
    if (powerSyncURI === null) {
      console.log('No powerSyncURI found')
      return null; // Return null if URI not found
    }
    console.log('powerSyncURI', powerSyncURI)
    
    return {
      // The PowerSync instance URL or self-hosted endpoint
      endpoint: powerSyncURI,
      /**
      * To get started quickly, use a development token, see:
      * Authentication Setup https://docs.powersync.com/installation/authentication-setup/development-tokens) to get up and running quickly
      */
      token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6InBvd2Vyc3luYy1kZXYtMzIyM2Q0ZTMifQ.eyJzdWIiOiIxNDgiLCJpYXQiOjE3NDY2MDc2NDksImlzcyI6Imh0dHBzOi8vcG93ZXJzeW5jLWFwaS5qb3VybmV5YXBwcy5jb20iLCJhdWQiOiJodHRwczovLzY3ZjZjMTZmOTg0YzZmNGNiMDc5NTljYS5wb3dlcnN5bmMuam91cm5leWFwcHMuY29tIiwiZXhwIjoxNzQ2NjUwODQ5fQ.uZ8Np42BmDhW-f7FYkydw47uDXOJ3SigFUePZw80sGdTA2yu21kbpoUleKzvFxuAPDDnzkjK9a9Ew4NOGZqjw1M1b0SQVLQdX8Ev0Srkc5qy7h8ufp8drf4Oip2mvLAYHX3MVCR8qS2k4gP1kLU8mrT3L6vwbO8zYJL3gRdPFul3D0EEXhXXbG-c52WRTDWw-HB8kvIXjKCRbCfOn9NRHc-FrUx3WcrLUL8usCWcz_j_addvoPuTi2qDvbmpmZgreo8bLb-bzzTCr0DCreZL9MIDYqDpj2ReeA6ubAZqLOXMNqWcNCsV8s8OkqerrO96-6EaRs0BcpQ5oMcsOG6QBQ'
    };
  }

  /**
  * Implement uploadData to send local changes to your backend service.
  * You can omit this method if you only want to sync data from the database to the client
  * See example implementation here:https://docs.powersync.com/client-sdk-references/react-native-and-expo#3-integrate-with-your-backend
  */
  async uploadData(database: AbstractPowerSyncDatabase) {

    /**
    * For batched crud transactions, use data.getCrudBatch(n);
    * https://powersync-ja.github.io/powersync-js/react-native-sdk/classes/SqliteBucketStorage#getcrudbatch
    */
    const transaction = await database.getNextCrudTransaction();

    if (!transaction) {
      return;
    }

    for (const op of transaction.crud) {
      // The data that needs to be changed in the remote db
      const record = { ...op.opData, id: op.id };
      switch (op.op) {
        case UpdateType.PUT:
          // TODO: Instruct your backend API to CREATE a record
          break;
        case UpdateType.PATCH:
          // TODO: Instruct your backend API to PATCH a record
          break;
        case UpdateType.DELETE:
          //TODO: Instruct your backend API to DELETE a record
          break;
      }
    }

    // Completes the transaction and moves onto the next one
    await transaction.complete();
  }
}