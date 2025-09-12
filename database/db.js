import mongoose from "mongoose";

const MAX_RETRIES = 3;
//how many times mongoose should retry before giving error

const RETRY_INTERVAL = 5000; // 5 seconds

class DatabaseConnection {
    constructor() {
        this.retryCount = 0;
        this.isConnected = false; 

        //If these things are not mentioned then you should not
        //even query in the database this is strictQuery 
        
        //configure mongoose settings:
        mongoose.set('strictQuery', true);
    
        // Handle connection events
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connected successfully');
            this.isConnected = true;
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
            this.isConnected = false;
        });

         mongoose.connection.on('disconnected', (err) => {
           console.log('⚠️ MongoDB disconnected');
            this.isConnected = false;
            this.handleDisconnection();
        });

        // Handle application termination
        process.on('SIGINT', this.handleAppTermination.bind(this));
        process.on('SIGTERM', this.handleAppTermination.bind(this));
        
        //inside contructor you have to use bind other it woudlnt know
        //who called this
        //we are passing the context of it

           }

    async connect() {  //connect now

        try {
            if (!process.env.MONGO_URI) {
                throw new Error('MongoDB URI is not defined in environment variables');
            } //check if string is there or not

            const connectionOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4, // Use IPv4
            };

            if (process.env.NODE_ENV === 'development') {
                mongoose.set('debug', true);
                //help debug on all stuff like stack and all
            }

            await mongoose.connect(process.env.MONGO_URI, connectionOptions);
            this.retryCount = 0; // Reset retry count on successful connection
            
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error.message);
            await this.handleConnectionError();
            //try again after 5 seconds
        }
    }

    async handleConnectionError() {   
        if (this.retryCount < MAX_RETRIES) {
            this.retryCount++; //increase retry count
            console.log(`Retrying 
                connection... Attempt ${this.retryCount} 
                of ${MAX_RETRIES}`);
            await new Promise(resolve => setTimeout(
                resolve,
                 RETRY_INTERVAL));
            return this.connect(); //after 5 sec try connecting again
        } else {
            console.error(`Failed to connect to MongoDB 
                after ${MAX_RETRIES} attempts`);
            process.exit(1);
        }
    }
        

    async handleDisconnection() {
        if (!this.isConnected) {
            console.log('Attempting to reconnect to MongoDB...');
            this.connect();
        } //if is disconnected then try to reconnect
    }

    async handleAppTermination() {
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0); //maybe someone closed it
        } catch (err) {
            console.error('Error during database disconnection:', err);
            process.exit(1);
        }
    }

    // Get the current connection status
    getConnectionStatus() {
        return { //moongoose connection has a lot of stuff
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        };
    }
}

// Create a singleton instance
const dbConnection = new DatabaseConnection();

//bind() method of Function instances creates a new Function that when called
//calls this function with its this keyword set to the provided value

// Export the connect function and the instance
export default dbConnection.connect.bind(dbConnection);
//attaching context

export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);