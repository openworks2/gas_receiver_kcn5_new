'use strict'

const { Stack, Duration, RemovalPolicy } = require('aws-cdk-lib')
const iam = require('aws-cdk-lib/aws-iam')
const sqs = require('aws-cdk-lib/aws-sqs')
const ecr = require('aws-cdk-lib/aws-ecr')
const ecs = require('aws-cdk-lib/aws-ecs')
const ec2 = require('aws-cdk-lib/aws-ec2')
const logs = require('aws-cdk-lib/aws-logs')

class CloudGasServerStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props)

    const gasRecordSQS = new sqs.Queue(this, 'gasRecordSQS', {
      visibilityTimeout: Duration.seconds(30),
      queueName: 'gasRecordSQS',
    })

    const gasAlarmSQS = new sqs.Queue(this, 'gasAlarmSQS', {
      visibilityTimeout: Duration.seconds(30),
      queueName: 'gasAlarmSQS',
    })

    const taskRole = new iam.Role(this, 'GasTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: 'GasTaskRole',
    })

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
        resources: [gasRecordSQS.queueArn, gasAlarmSQS.queueArn],
      }),
    )

    new iam.Policy(this, 'LambdaSQSPolicy', {
      statements: [
        new iam.PolicyStatement({
          actions: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
          resources: [gasAlarmSQS.queueArn],
        }),
      ],
    })

    const vpc = new ec2.Vpc(this, 'GasVpc', { maxAzs: 1 })

    const cluster = new ecs.Cluster(this, 'GasCluster', { vpc, clusterName: 'GasCluster' })

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow inbound HTTP traffic',
      allowAllOutbound: true,
    })

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80))

    cluster.addCapacity('DefaultAutoScalingGroupCapacity', {
      instanceType: new ec2.InstanceType('t3a.medium'),
      desiredCapacity: 1,
      minCapacity: 1,
      maxCapacity: 2,
      associatePublicIpAddress: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup,
    })

    const repository = ecr.Repository.fromRepositoryName(this, 'ExistingRepository', 'gas-ecr-repo')

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'GasTaskDefinition', {
      // 1 vCPU
      cpu: '1024',
      // 1GB
      memoryLimitMiB: 2048,
      taskRole,
    })

    new ecs.Ec2Service(this, 'GasClusterService', {
      cluster,
      taskDefinition,
      serviceName: 'GasClusterService',
    })

    const gasLogGroup = new logs.LogGroup(this, 'GasLogGroup', {
      logGroupName: '/ecs/gas-cloud-server',
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const container = taskDefinition.addContainer('GasSeverContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      memoryLimitMiB: 2048,
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'GasServer',
        logGroup: gasLogGroup,
      }),
    })

    container.addPortMappings({
      containerPort: 80,
      hostPort: 80,
      protocol: ecs.Protocol.TCP,
    })
  }
}

module.exports = { CloudGasServerStack }
