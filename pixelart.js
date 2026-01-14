//https://dev.to/0shuvo0/lets-create-a-pixel-art-maker-with-javascript-4016

const container = document.querySelector('.container');
const sizeEl = document.querySelector('.size');
const color = document.querySelector('.color');
const resetBtn = document.querySelector('.btn');

let size = sizeEl.value;
let draw = false;


function populate(size) {
    container.style.setProperty('--size', size);
    for (let i = 0; i < size * size; i++) {
        const div = document.createElement('div');
        div.setAttribute("id", i);  // <div id="0" class="pixel" style="background-color: rgb(0, 238, 255)"></div>
        div.classList.add('pixel');

        div.addEventListener('mouseover', function (event) {
            if (!draw) return;
            
            const divId = event.target.id;
            const r = parseInt(color.value.slice(1, 3), 16);
            const g = parseInt(color.value.slice(3, 5), 16);
            const b = parseInt(color.value.slice(5, 7), 16);

            // Write to the ESP32 LED Characteristic
            //writeOnCharacteristic(divId,r,g,b);
            if (bleServer && bleServer.connected) {
                bleServiceFound.getCharacteristic(ledCharacteristic)
                    .then(characteristic => {
                        console.log("Found the LED characteristic: ", characteristic.uuid);
						div.style.backgroundColor = color.value;  // #00eeff

                        const data = new Uint8Array([divId, r, g, b]);  //id,R,G,B
                        return characteristic.writeValueWithResponse(data);
                    })
                    .catch(error => {
                        console.error("Error writing to the LED characteristic: ", error);
                    });
            } else {
                console.error("Bluetooth is not connected. Cannot write to characteristic.");
                window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
            }
        })

        div.addEventListener('mousedown', function (event) {
            const divId = event.target.id;
            const r = parseInt(color.value.slice(1, 3), 16);
            const g = parseInt(color.value.slice(3, 5), 16);
            const b = parseInt(color.value.slice(5, 7), 16);

            // Write to the ESP32 LED Characteristic
            //writeOnCharacteristic(divId,r,g,b);
            if (bleServer && bleServer.connected) {
                bleServiceFound.getCharacteristic(ledCharacteristic)
                    .then(characteristic => {
                        console.log("Found the LED characteristic: ", characteristic.uuid);
						div.style.backgroundColor = color.value;  // #00eeff

                        const data = new Uint8Array([divId, r, g, b]);  //id,R,G,B
                        return characteristic.writeValueWithResponse(data);
                    })
                    .catch(error => {
                        console.error("Error writing to the LED characteristic: ", error);
                    });
            } else {
                console.error("Bluetooth is not connected. Cannot write to characteristic.")
                window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
            }
        })

        container.appendChild(div)
    }
}

window.addEventListener("mousedown", function () {
    draw = true
})
window.addEventListener("mouseup", function () {
    draw = false
})

function reset() {
    container.innerHTML = ''
    populate(size)

	if (bleServer && bleServer.connected) {
		bleServiceFound.getCharacteristic(ledCharacteristic)
		.then(characteristic => {
			console.log("Found the LED characteristic: ", characteristic.uuid);

			const data = new Uint8Array([255, 0, 0, 0]);  //reset clear
			return characteristic.writeValueWithResponse(data);
		})
		.catch(error => {
			console.error("Error writing to the LED characteristic: ", error);
		});
	} else {
		console.error("Bluetooth is not connected. Cannot write to characteristic.")
		window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
	}
}

resetBtn.addEventListener('click', reset)

sizeEl.addEventListener('keyup', function () {
    size = sizeEl.value
    reset()
})

populate(size)


// DOM Elements
const connectButton = document.getElementById('connectBleButton');
const disconnectButton = document.getElementById('disconnectBleButton');
const bleStateContainer = document.getElementById('bleState');

//Define BLE Device Specs
var deviceName = 'ESP32-C3';
var bleService = '19b10000-e8f2-537e-4f6c-d104768a1214';
var ledCharacteristic = '19b10002-e8f2-537e-4f6c-d104768a1214';
var sensorCharacteristic = '19b10001-e8f2-537e-4f6c-d104768a1214';

//Global Variables to Handle Bluetooth
var bleServer;
var bleServiceFound;
var sensorCharacteristicFound;

// Connect Button (search for BLE Devices only if BLE is available)
connectButton.addEventListener('click', (event) => {
    if (isWebBluetoothEnabled()) {
        connectToDevice();
    }
});

// Disconnect Button
disconnectButton.addEventListener('click', disconnectDevice);

// Check if BLE is available in your Browser
function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
        console.log('Web Bluetooth API is not available in this browser!');
        bleStateContainer.innerHTML = "Web Bluetooth API is not available in this browser/device!";
        return false
    }
    console.log('Web Bluetooth API supported in this browser.');
    return true
}

// Connect to BLE Device and Enable Notifications
function connectToDevice() {
    console.log('Initializing Bluetooth...');
    navigator.bluetooth.requestDevice({
        filters: [{ name: deviceName }],
        optionalServices: [bleService]
    })
        .then(device => {
            console.log('Device Selected:', device.name);
            bleStateContainer.innerHTML = 'Connected to ' + device.name;
            bleStateContainer.style.color = "#24af37";
            device.addEventListener('gattservicedisconnected', onDisconnected);
            return device.gatt.connect();
        })
        .then(gattServer => {
            bleServer = gattServer;
            console.log("Connected to GATT Server");
            return bleServer.getPrimaryService(bleService);
        })
        .then(service => {
            bleServiceFound = service;
            console.log("Service discovered:", service.uuid);
            return service.getCharacteristic(sensorCharacteristic);
        })
        .catch(error => {
            console.log('Error: ', error);
        })
}

function onDisconnected(event) {
    console.log('Device Disconnected:', event.target.device.name);
    bleStateContainer.innerHTML = "Device disconnected";
    bleStateContainer.style.color = "#d13a30";

    connectToDevice();
}

function writeOnCharacteristic(valueR, valueG, valueB) {    //(valueR,valueG,valueB)
    if (bleServer && bleServer.connected) {
        bleServiceFound.getCharacteristic(ledCharacteristic)
            .then(characteristic => {
                console.log("Found the LED characteristic: ", characteristic.uuid);

                const data = new Uint8Array([valueR, valueG, valueB]);  //R,G,B
                return characteristic.writeValueWithResponse(data);
            })
            .catch(error => {
                console.error("Error writing to the LED characteristic: ", error);
            });
    } else {
        console.error("Bluetooth is not connected. Cannot write to characteristic.")
        window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
    }
}

function disconnectDevice() {
    console.log("Disconnect Device.");
    if (bleServer && bleServer.connected) {
        return bleServer.disconnect();
    } else {
        // Throw an error if Bluetooth is not connected
        console.error("Bluetooth is not connected.");
        window.alert("Bluetooth is not connected.")
    }
}

