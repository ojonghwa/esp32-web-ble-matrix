/* ESP32-C3 Web-BLE, 8x8 LED Matrix
*/
#include <ArduinoBLE.h>  //v1.5.0
#include <FastLED.h>

#define NUM_LEDS    64     // 8x8
#define DATA_PIN    4
CRGB leds[NUM_LEDS];

BLEService bleService("19b10000-e8f2-537e-4f6c-d104768a1214");
BLECharacteristic bleCharacteristic("19b10002-e8f2-537e-4f6c-d104768a1214", BLERead | BLEWrite, 4);  //4바이트 id,R,G,B 전송 
// Characteristic 선언 시 실제 전송할 데이터의 최대 크기를 지정

void setup() {
  Serial.begin(115200);
  delay(1000);
  FastLED.addLeds<WS2811, DATA_PIN, GRB>(leds, NUM_LEDS).setCorrection(TypicalSMD5050);
  FastLED.setBrightness(30);

  while (!BLE.begin()) { delay(5); }
  BLE.setLocalName("ESP32-C3");
  BLE.setAdvertisedService(bleService);
  bleService.addCharacteristic(bleCharacteristic);
  BLE.addService(bleService);
  uint8_t initialValue[] = {0,0,0};
  bleCharacteristic.writeValue(initialValue, sizeof(initialValue));
  BLE.advertise();  //BLE start
}

void loop() {
  BLEDevice central = BLE.central();
  if (central) {
    while (central.connected()) {
      if (bleCharacteristic.written()) {
        uint8_t value[5];
        int bytesRead = bleCharacteristic.readValue(&value, sizeof(value));
        if (bytesRead > 0) {
          Serial.print("value[]: ");
          for (int i = 0; i < bytesRead; i++) {
            Serial.print(value[i]);  Serial.print(" ");
          }
          Serial.println();
        }
        int id = value[0];
        if(id == 255) {
          FastLED.clear();
        } else {
          leds[id].r = value[1];
          leds[id].g = value[2];
          leds[id].b = value[3];
        }
        FastLED.show();
      }
    }
  }
}
