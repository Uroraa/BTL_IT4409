
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include "DHT.h"

#define DHTPIN 4 // NodeMCU: D2 == GPIO 4
#define DHTTYPE DHT22
#define LIGHT_PIN A0
#define LED_PIN 5 // NodeMCU: D1 == GPIO 5

DHT dht(DHTPIN, DHTTYPE);

const char *ssid = "MIGHTZZ";
const char *password = "tu1den10";

const char *mqtt_server = "dff8f7471d7745a6907092c74b9267e6.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char *mqtt_user = "Project220251";
const char *mqtt_pass = "Project220251";

const char *topic_publish = "iot/sensor/data";
const char *topic_alert = "home/alert";

WiFiClientSecure espClient;
PubSubClient client(espClient);
long lastMsg = 0;

void callback(char *topic, byte *payload, unsigned int length)
{
  String message = "";
  for (int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }
  Serial.print("Nhan lenh: ");
  Serial.println(message);

  if (message == "ON")
  {
    digitalWrite(LED_PIN, HIGH);
  }
  else if (message == "OFF")
  {
    digitalWrite(LED_PIN, LOW);
  }
}

void setup_wifi()
{
  delay(10);
  Serial.println();
  Serial.print("Dang ket noi WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  espClient.setInsecure();
}

void reconnect()
{
  while (!client.connected())
  {
    Serial.print("Dang ket noi MQTT...");
    String clientId = "NodeMCU-" + String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass))
    {
      Serial.println("THANH CONG!");

      client.subscribe(topic_alert);
    }
    else
    {
      Serial.print("Loi, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void setup()
{
  Serial.begin(115200);
  dht.begin();
  pinMode(LIGHT_PIN, INPUT);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH); // Mặc định tắt

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  client.setCallback(callback);
}

void loop()
{
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 5000)
  {
    lastMsg = now;

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int lightValue = analogRead(LIGHT_PIN);

    if (isnan(h) || isnan(t))
    {
      Serial.println("Loi DHT!");
      return;
    }

    char msg[100];
    snprintf(msg, 100, "{\"temp\":%.2f, \"humi\":%.2f, \"light\":%d}", t, h, lightValue);

    Serial.print("Gui: ");
    Serial.println(msg);
    client.publish(topic_publish, msg);
  }
}