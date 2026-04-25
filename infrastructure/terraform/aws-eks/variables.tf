variable "project_name" {
  description = "Project name used for AWS resource names and tags."
  type        = string
  default     = "nasibashop"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region where the EKS cluster will be created."
  type        = string
  default     = "eu-central-1"
}

variable "kubernetes_version" {
  description = "EKS Kubernetes control plane version."
  type        = string
  default     = "1.30"
}

variable "vpc_cidr" {
  description = "CIDR block for the EKS VPC."
  type        = string
  default     = "10.40.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets."
  type        = list(string)
  default     = ["10.40.0.0/20", "10.40.16.0/20"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets used by worker nodes."
  type        = list(string)
  default     = ["10.40.128.0/20", "10.40.144.0/20"]
}

variable "node_instance_types" {
  description = "EC2 instance types for the default EKS managed node group."
  type        = list(string)
  default     = ["t3.large"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes."
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum number of worker nodes."
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum number of worker nodes."
  type        = number
  default     = 6
}
