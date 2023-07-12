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

To submit a job locally, here's an example:

```
gcloud pubsub topics publish asset-responses-2 --message='{"vertical":"MF","rootdomain":"livexavier.com","rootProtocol":"http","locationId":9999,"pages":["https://livexavier.com/","https://livexavier.com/galleries"],"scrapers":{"photos":true,"amenities":true,"address":true,"emails":true,"phoneNumber":true,"social":true},"template":{"address":{"selector":null},"phone":{"selector":null},"email":{"selector":null},"social":{"selector":null},"amenities":{"selector":null,"slug":null}},"amenitiesConfig":{"community_amenities":[{"text":"Basketball Court","value":"basketballCourt","variants":["basketball"]},{"text":"Business Center","value":"businessCenter","variants":[]},{"text":"Carport Parking Available","value":"carportParking","variants":["carport"]},{"text":"Close to Dog Park","value":"closeToDogPark","variants":["near a dog park","by a dog park"]}],"apartment_amenities":[{"text":"Air Conditioning","value":"airConditioning","variants":["air conditioner","ac"]},{"text":"Cable Included","value":"cableIncluded","variants":[]}]},"config":{"photos":{"folder":"onboarder-temporary/__tests__/a0E3l00000MwvHTEST"}}}'
```
This will return a message id is published successfully.


## Pub Sub Worker

Deployed as a private service, the API will not be accessible on the internet, so it uses pubsub to handle IO.

Checkout the branch you wish to deploy.
Set the Kubernetes context you want to deploy to.
Run `npm run deploy`

Override defaults by running
``` sh
./upgrade.sh -t <tag> -p <project> -d <deployment_name>
```
## Helm Dependencies

If you encounter issues deploying, it might be because your system does not have access to G5 helpers.

[GCS Helm Plugin](https://github.com/hayorov/helm-gcs)
``` console
helm repo add g5-multiverse-helm3-repositories gs://g5-multiverse-helm3-repositories
helm plugin install https://github.com/hayorov/helm-gcs.git
helm plugin update gcs
helm gcs init gs://g5-multiverse-helm3-repositories
helm dep up
```
