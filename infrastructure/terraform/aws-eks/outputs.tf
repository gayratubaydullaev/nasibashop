output "cluster_name" {
  description = "EKS cluster name."
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "EKS Kubernetes API endpoint."
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64-encoded EKS cluster certificate authority data."
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID used by the EKS cluster."
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs used by EKS worker nodes."
  value       = aws_subnet.private[*].id
}

output "kubectl_update_kubeconfig_command" {
  description = "Command to configure kubectl for this cluster."
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
