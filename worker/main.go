package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"github.com/redis/go-redis/v9"
	"google.golang.org/api/option"
)

const (
	QueueKey = "notification_queue"
	DataKeyPrefix = "notification:data:"
	BatchSize = 10
)

type NotificationPayload struct {
	Tokens []string `json:"tokens"`
	Title string `json:"title"`
	Body string `json:"body"`
	Data map[string]string `json:"data"`
}

var ctx = context.Background()

func main() {
	redisArr := getEnv("REDIS_URL", "localhost") + ":" + getEnv("REDIS_PORT", "6379")
	redisPassword := getEnv("REDIS_PASSWORD", "securepassword")

	rdb := redis.NewClient(&redis.Options{
		Addr: redisArr,
		Password: redisPassword,
		DB: 0,
	})
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}
	fmt.Println("✅ Connected to Redis", redisArr)

	opt := option.WithAuthCredentialsFile(option.ServiceAccount, "serviceAccountKey.json")
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Fatalf("❌ Failed to initialize Firebase: %v", err)
	}
	fmt.Println("✅ Connected to Firebase")
	client, err := app.Messaging(ctx)
	if err != nil {
		log.Fatalf("❌ Failed to initialize Firebase Messaging: %v", err)
	}
	fmt.Println("✅ Connected to Firebase Messaging")

	for {
		processJobs(rdb, client)
		time.Sleep(1 * time.Second)
	}
}

func processJobs(rdb *redis.Client, fcm *messaging.Client) {
	now := float64(time.Now().Unix())

	jobIDs, err := rdb.ZRangeByScore(ctx, QueueKey, &redis.ZRangeBy{
		Min:   "-inf",
		Max:   fmt.Sprintf("%f", now),
		Count: BatchSize,
	}).Result()

	if err != nil {
		log.Printf("⚠️ Redis Error: %v", err)
		return
	}

	if len(jobIDs) == 0 {
		return
	}
	
	for _, jobID := range jobIDs {
		
		removed, err := rdb.ZRem(ctx, QueueKey, jobID).Result()
		if err != nil {
			log.Printf("⚠️ Redis ZRem Error: %v", err)
			continue
		}
		if removed == 0 {
			continue
		}
		
		payloadKey := DataKeyPrefix + jobID
		dataJSON, err := rdb.Get(ctx, payloadKey).Result()
		
		rdb.Del(ctx, payloadKey)

		if err == redis.Nil {
			log.Printf("⚠️ Orphan Job %s: Data missing. Skipping.", jobID)
			continue
		} else if err != nil {
			log.Printf("⚠️ Redis Get Error: %v", err)
			continue
		}

		var p NotificationPayload
		if err := json.Unmarshal([]byte(dataJSON), &p); err != nil {
			log.Printf("❌ JSON Parse Error for job %s: %v", jobID, err)
			continue
		}

		go sendToFCM(fcm, p, jobID)
	}
}

func sendToFCM(client *messaging.Client, p NotificationPayload, jobID string) {
	if len(p.Tokens) == 0 {
		return
	}

	message := &messaging.MulticastMessage{
		Tokens: p.Tokens,
		Notification: &messaging.Notification{
			Title: p.Title,
			Body:  p.Body,
		},
		Data: p.Data,
	}

	br, err := client.SendEachForMulticast(ctx, message)
	if err != nil {
		log.Printf("🔥 FCM Failed for job %s: %v", jobID, err)
		return
	}

	if br.FailureCount > 0 {
		log.Printf("⚠️ Job %s: %d sent, %d failed", jobID, br.SuccessCount, br.FailureCount)
	} else {
		log.Printf("✅ Job %s: Sent to %d devices", jobID, br.SuccessCount)
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}