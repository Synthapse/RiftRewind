# Rift Rewind


gcloud artifacts repositories add-iam-policy-binding videoanalyzer-microservice \
  --location=europe-central2 \
  --project=cognispace \
  --member="allUsers" \
  --role="roles/artifactregistry.writer"


# Data:

high_diamond_ranked 
https://www.kaggle.com/code/servietsky/league-of-legends-what-to-do-in-first-10-min?select=high_diamond_ranked_10min.csv

analysing win attributes
https://www.kaggle.com/code/fortyeth/analyzing-win-attributes-in-league-of-legends?select=LeagueofLegends.csv

win_predictions
https://www.kaggle.com/code/gulsahdemiryurek/let-s-predict-league-of-legends-match-score


# Infrastructure

Infrastructure is hosted via AWS: 

- aws sts get-caller-identity


  Bedrock:

  Think of Bedrock as a universal interface to multiple AI “brains” in the cloud. You don’t care about their GPUs, updates, or scaling — you just send them a request and get results.

  (sending requests)

{
    "modelId": "ai21.j2.large",
    "inputText": "Write a short poem about autumn."
}