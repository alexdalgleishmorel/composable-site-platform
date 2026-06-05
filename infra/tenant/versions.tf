terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Per-tenant state: pass a distinct key per tenant, e.g.
  #   -backend-config="key=tenant/jmdm.org/terraform.tfstate"
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project   = "composable-site-platform"
      ManagedBy = "terraform"
      Stack     = "tenant"
      Tenant    = var.tenant_domain
    }
  }
}

# CloudFront requires its ACM certificate in us-east-1, regardless of the site's region.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = {
      Project = "composable-site-platform"
      Tenant  = var.tenant_domain
    }
  }
}
