terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # Remote state created by infra/bootstrap (#2). Configure via `-backend-config` or edit here.
  backend "s3" {
    key = "shared/terraform.tfstate"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project   = "composable-site-platform"
      ManagedBy = "terraform"
      Stack     = "shared"
    }
  }
}
