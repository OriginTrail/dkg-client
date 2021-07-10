class Logger {
    info (message) {
        console.log(message);
    }

    debug (message) {
        console.log(message);
    }

    error (message) {
        console.log(message);
    }
}

module.exports = new Logger();
