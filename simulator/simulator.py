import paho.mqtt.client as mqtt
import random
import time
import json
import os
import json
CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'config.json')
with open(CONFIG_FILE, 'r') as f:
    config = json.load(f)

broker = config["broker"]
port = config["port"]
topic = config["topic"]
device_id = config["device_id"]
interval = config["interval"]

client = mqtt.Client(device_id)

def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")
        else:
            print("Failed to connect, return code %d\n", rc)

    client.on_connect = on_connect
    client.connect(broker, port)
    return client

def publish(client):
    while True:
        temperature = round(random.uniform(25.0, 35.0), 2)
        humidity = round(random.uniform(40.0, 80.0), 2)
        
        message = {
            "device_id": device_id,
            "temperature": temperature,
            "humidity": humidity,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        client.publish(topic, json.dumps(message))
        print(f"Sent: {message}")
        time.sleep(interval)

def run():
    client = connect_mqtt()
    client.loop_start()
    publish(client)

if __name__ == '__main__':
    run()
