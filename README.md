# Rift Rewind


gcloud artifacts repositories add-iam-policy-binding videoanalyzer-microservice \
  --location=europe-central2 \
  --project=cognispace \
  --member="allUsers" \
  --role="roles/artifactregistry.writer"