
provider "aws" {
  region = "us-east-2"
}

terraform {
  backend "s3" {
    bucket  = "calscoo-terraform-state"
    key     = "gallery.tfstate"
    encrypt = true
    region  = "us-east-2"
  }
}
