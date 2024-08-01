# Cloud Gas Service

This is a project for CDK development with JavaScript.

The `cloud_gas_server-stack` file defined the AWS resources used in this project

## Push docker image to ECR When Create or Update

### Make ERC

- make repository named gas-ecr-repo

### Build Your Docker Image

- docker build -t gas-cloud-server .

### Tag Your Docker Image for AWS ECR

- docker tag gas-cloud-server:latest 211125308791.dkr.ecr.ap-northeast-2.amazonaws.com/gas-ecr-repo:latest

### Push Your Docker Image to AWS ECR

- aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 211125308791.dkr.ecr.ap-northeast-2.amazonaws.com

- docker push 211125308791.dkr.ecr.ap-northeast-2.amazonaws.com/gas-ecr-repo:latest

## Deployment project

- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` synthesizes a stack defined in your app into a CloudFormation template
- `npx cdk bootstrap` bootstrap environment, this will generate stack 'CDKToolkit' and bucket
- `npx cdk deploy` deploy this stack to your default AWS account/region

## Add public IP of EC2 to mongoDB

Atlas needs add public IP to IP Access List in Network Access

## Tips for wired behavior

### if sqs not consumed, try inactive it form lambda and activity it again
