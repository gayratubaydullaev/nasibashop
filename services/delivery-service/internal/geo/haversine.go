package geo

import "math"

const earthRadiusKm = 6371.0

// DistanceKm returns great-circle distance between two WGS84 points in kilometers.
func DistanceKm(lat1, lon1, lat2, lon2 float64) float64 {
	p1 := lat1 * math.Pi / 180
	p2 := lat2 * math.Pi / 180
	dlat := (lat2 - lat1) * math.Pi / 180
	dlon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(dlat/2)*math.Sin(dlat/2) +
		math.Cos(p1)*math.Cos(p2)*math.Sin(dlon/2)*math.Sin(dlon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return earthRadiusKm * c
}
