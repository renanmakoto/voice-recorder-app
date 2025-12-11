const { app } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Simple JSON-based persistent storage for user preferences
 */
class Store {
    /**
     * Creates a new Store instance
     * @param {Object} options - Configuration options
     * @param {string} options.configName - Name of the config file (without extension)
     * @param {Object} options.defaults - Default values for the store
     */
    constructor(options) {
        const userDataPath = app.getPath('userData');
        this.path = path.join(userDataPath, `${options.configName}.json`);
        this.defaults = options.defaults || {};
        this.data = this._loadData();
    }

    /**
     * Loads data from the config file
     * @returns {Object} The parsed data or defaults
     * @private
     */
    _loadData() {
        try {
            if (fs.existsSync(this.path)) {
                const fileContent = fs.readFileSync(this.path, 'utf-8');
                return { ...this.defaults, ...JSON.parse(fileContent) };
            }
        } catch (error) {
            console.error('Error loading config file:', error);
        }
        return { ...this.defaults };
    }

    /**
     * Gets a value from the store
     * @param {string} key - The key to retrieve
     * @returns {*} The value associated with the key
     */
    get(key) {
        return this.data[key];
    }

    /**
     * Sets a value in the store and persists it
     * @param {string} key - The key to set
     * @param {*} value - The value to store
     */
    set(key, value) {
        this.data[key] = value;
        this._saveData();
    }

    /**
     * Saves the current data to the config file
     * @private
     */
    _saveData() {
        try {
            const dirPath = path.dirname(this.path);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Error saving config file:', error);
        }
    }
}

module.exports = Store;