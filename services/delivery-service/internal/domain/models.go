package domain

import "time"

type StoreLocation struct {
	ID            string         `json:"id"`
	StoreID       string         `json:"storeId"`
	Name          string         `json:"name"`
	AddressLine   string         `json:"addressLine,omitempty"`
	Latitude      float64        `json:"latitude"`
	Longitude     float64        `json:"longitude"`
	WorkingHours  map[string]any `json:"workingHours,omitempty"`
	Active        bool           `json:"active"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
}

type DeliveryZone struct {
	ID                string  `json:"id"`
	StoreLocationID   string  `json:"storeLocationId"`
	Name              string  `json:"name"`
	CenterLatitude    float64 `json:"centerLatitude"`
	CenterLongitude   float64 `json:"centerLongitude"`
	RadiusKm          float64 `json:"radiusKm"`
	BaseFeeUnits      int64   `json:"baseFeeUnits"`
}

type Delivery struct {
	ID                      string    `json:"id"`
	OrderID                 string    `json:"orderId"`
	UserID                  string    `json:"userId"`
	StoreID                 string    `json:"storeId"`
	FulfillmentType         string    `json:"fulfillmentType"`
	Status                  string    `json:"status"`
	FeeUnits                int64     `json:"feeUnits"`
	CurrencyCode            string    `json:"currencyCode"`
	PickupStoreID           string    `json:"pickupStoreId,omitempty"`
	DeliveryRegion          string    `json:"deliveryRegion,omitempty"`
	DeliveryDistrict        string    `json:"deliveryDistrict,omitempty"`
	DeliveryStreet          string    `json:"deliveryStreet,omitempty"`
	DeliveryHouse           string    `json:"deliveryHouse,omitempty"`
	DeliveryApartment       string    `json:"deliveryApartment,omitempty"`
	DeliveryLandmark        string    `json:"deliveryLandmark,omitempty"`
	DeliveryLatitude        *float64  `json:"deliveryLatitude,omitempty"`
	DeliveryLongitude       *float64  `json:"deliveryLongitude,omitempty"`
	AssignedStoreLocationID string    `json:"assignedStoreLocationId,omitempty"`
	CreatedAt               time.Time `json:"createdAt"`
	UpdatedAt               time.Time `json:"updatedAt"`
}

type TrackingPoint struct {
	ID         string    `json:"id"`
	DeliveryID string    `json:"deliveryId"`
	Status     string    `json:"status"`
	Latitude   *float64  `json:"latitude,omitempty"`
	Longitude  *float64  `json:"longitude,omitempty"`
	Note       string    `json:"note,omitempty"`
	RecordedAt time.Time `json:"recordedAt"`
}

const (
	StatusCreated          = "CREATED"
	StatusAssigned         = "ASSIGNED"
	StatusInTransit        = "IN_TRANSIT"
	StatusDelivered        = "DELIVERED"
	StatusReadyForPickup   = "READY_FOR_PICKUP"
	StatusPickedUp          = "PICKED_UP"
	StatusCompleted        = "COMPLETED"
	StatusCancelled          = "CANCELLED"
	FulfillmentDelivery    = "DELIVERY"
	FulfillmentPickup      = "PICKUP"
)
