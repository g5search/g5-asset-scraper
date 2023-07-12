# bin/bash

DEPLOYMENT="asset-scraper";
CONTEXT=$(kubectl config current-context);
BRANCH=$(git rev-parse --abbrev-ref HEAD);
SHA=$(git rev-parse --short HEAD);
USER=$(gcloud config get-value account | cut -d '@' -f 1);
TAG=$BRANCH-$SHA;
GREEN='\033[0;32m';
NC='\033[0m';

Deploy()
{
  helm upgrade --install --namespace=default $DEPLOYMENT --set node-web-service.image.tag=$TAG --values=chart/opex-$PROJECT-values.yaml --set=deployer.user=$USER ./chart/;
  printf "Deployed ${GREEN}$BRANCH-$SHA ${NC}to ${GREEN}$CONTEXT ${NC} \n";
}

Confirm()
{
    printf "Deploy ${GREEN}$DEPLOYMENT:$TAG ${NC}to ${GREEN}$PROJECT${NC}? \n";
  read -p "[Y/n]: " CONFIRM;
  if [ "$CONFIRM" != "y" ]; then
    printf "Exiting... \n";
    exit 1;
  fi
  Deploy;
}

case $CONTEXT in 
  *opex-prod*) PROJECT="prod";;
  *opex-prime*) PROJECT="prime";;
  *opex-staging*) PROJECT="staging";;
  *)
    printf "No deployment found for ${GREEN}$CONTEXT ${NC} \n";
    printf "Please check your kubectl context to use an <opex> cluster \n"
    exit 1;
    ;;
esac

while getopts d:p:t: flag
do
  case "${flag}" in
    d) DEPLOYMENT=${OPTARG};;
    p) PROJECT=${OPTARG};;
    t) TAG=${OPTARG};;
  esac
done

Confirm;
