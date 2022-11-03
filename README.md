# g5-asset-scraper

An extensible website crawler that scrapes relevant location information and assets for onboarding.

## Develop

Clone Repo
Install deps
Start Redis
Define variables
Run locally
Test with API
Run Unit Tests
Deploy with Docker and Helm
## Request Body

The post payload accepts a JSON body.
``` json
{
  "rootProtocol": "https",
  "vertical": "MF",
  "locationProjectId": 1234, // the ID for the row in the locationProjects table of the Onboarder
  "rootDomain": "example.com",
  "pages": [],
  "scrapers": {},
  "template": {},
  "config": {},
  "amenitiesConfig": {
    "apartmentAmenities": [],
    "communityAmenities": []
  }
}

```
## Pub Sub Worker

Deployed as a private service, the API will not be accessible on the internet, so it uses pubsub to handle IO.
