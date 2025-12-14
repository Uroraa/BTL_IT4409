#include <ESP8266WiFi.h>      
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include "DHT.h"

// --- CẤU HÌNH CẢM BIẾN CHO NODEMCU ---
#define DHTPIN 4       //  NodeMCU: D2 == GPIO 4
#define DHTTYPE DHT22  

#define LIGHT_PIN A0   

DHT dht(DHTPIN, DHTTYPE);

// --- CẤU HÌNH WIFI ---
const char* ssid = "MIGHTZZ";
const char* password = "tu1den10";

// --- CẤU HÌNH HIVEMQ CLOUD ---
const char* mqtt_server = "dff8f7471d7745a6907092c74b9267e6.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "Project220251";
const char* mqtt_pass = "Project220251";

const char* topic_publish = "iot/sensor/data";

// Khai báo client SSL cho ESP8266
WiFiClientSecure espClient;
PubSubClient client(espClient);
long lastMsg = 0;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Dang ket noi WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi da ket noi!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  espClient.setInsecure();
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Dang ket noi HiveMQ...");
    
    // Tạo ID ngẫu nhiên
    String clientId = "NodeMCU-" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("THANH CONG!");
    } else {
      Serial.print("Loi, rc=");
      Serial.print(client.state());
      Serial.println(" (thu lai sau 5s)");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  dht.begin();
  pinMode(LIGHT_PIN, INPUT); // NodeMCU A0 là Input

  setup_wifi();
  
  client.setServer(mqtt_server, mqtt_port);
  
  client.setBufferSize(512);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 5000) { 
    lastMsg = now;

    // 1. Đọc dữ liệu
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int lightValue = analogRead(LIGHT_PIN); // Đọc từ A0 (0-1024)

    if (isnan(h) || isnan(t)) {
      Serial.println("Loi: Khong doc duoc DHT!");
      return;
    }

    // 2. Tạo JSON
    char msg[100];
    snprintf(msg, 100, "{\"temp\":%.2f, \"hum\":%.2f, \"light\":%d}", t, h, lightValue);
    
    Serial.print("Gui len Cloud: ");
    Serial.println(msg);

    client.publish(topic_publish, msg);
  }
}