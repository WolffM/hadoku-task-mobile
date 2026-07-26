#!/usr/bin/env python3
"""
Complete GitHub Secrets Management Script
Self-contained script that:
1. Checks/creates virtual environment
2. Installs dependencies
3. Validates secrets
4. Updates secrets in target repositories
5. Verifies the updates

Usage: 
  python manage_github_token.py                    # Update HADOKU_SITE_TOKEN in child repos
  python manage_github_token.py --mode=cloudflare  # Update Cloudflare secrets in hadoku_site
  python manage_github_token.py --mode=all         # Update all secrets

Security Note:
  This script uses subprocess.run() to manage the virtual environment bootstrap process.
  All subprocess calls are safe:
  - Uses list arguments (not shell=True) to prevent command injection
  - Arguments are from controlled sources only (sys.executable, __file__, hardcoded strings, Path objects)
  - sys.argv pass-through is safe as arguments remain as list elements, not concatenated into shell commands
"""

import sys
import subprocess  # nosec B404 - Safe usage: list args, no shell=True, controlled sources only
import os
from pathlib import Path
import argparse
import base64
import time
from typing import Dict
import importlib.util

# Check if we're running in a virtual environment
def is_venv():
    return hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)

# Bootstrap: Setup virtual environment and install dependencies
def bootstrap():
    """Setup virtual environment and install dependencies if needed."""
    script_dir = Path(__file__).parent
    venv_dir = script_dir / '.venv'
    
    # Check if venv exists
    if not venv_dir.exists():
        print("📦 Virtual environment not found. Creating...")
        subprocess.run([sys.executable, '-m', 'venv', str(venv_dir)], check=True)
        print("✅ Virtual environment created")
    
    # Determine the python executable in venv
    if os.name == 'nt':  # Windows
        venv_python = venv_dir / 'Scripts' / 'python.exe'
        venv_pip = venv_dir / 'Scripts' / 'pip.exe'
    else:  # Unix-like
        venv_python = venv_dir / 'bin' / 'python'
        venv_pip = venv_dir / 'bin' / 'pip'
    
    # If not in venv, restart script with venv python
    if not is_venv():
        print("🔄 Restarting in virtual environment...")
        subprocess.run([str(venv_python), __file__] + sys.argv[1:], check=True)
        sys.exit(0)
    
    # Check if dependencies are installed
    requests_spec = importlib.util.find_spec("requests")
    nacl_spec = importlib.util.find_spec("nacl")
    
    if requests_spec is not None and nacl_spec is not None:
        print("✅ Dependencies already installed")
    else:
        print("📦 Installing dependencies...")
        subprocess.run([str(venv_pip), 'install', 'requests', 'PyNaCl', 'types-requests'], check=True)
        print("✅ Dependencies installed")
        print("🔄 Restarting to load new dependencies...")
        subprocess.run([str(venv_python), __file__] + sys.argv[1:], check=True)
        sys.exit(0)

# Run bootstrap
bootstrap()

# Now we can safely import the external dependencies
import requests  # noqa: E402
from nacl import public  # noqa: E402

# ============================================================================
# Configuration
# ============================================================================

# GitHub OAuth App Client ID (official GitHub CLI client ID)
CLIENT_ID = "178c6fc778ccc68e1d6a"

# Request timeout in seconds (prevents indefinite hanging - CWE-400)
# 30 seconds is sufficient for GitHub API calls while preventing resource exhaustion
REQUEST_TIMEOUT = 30

# Secret configurations
SECRET_CONFIGS = {
    'child-repos': {
        'description': 'HADOKU_SITE_TOKEN for child micro-app repositories',
        'secrets': ['HADOKU_SITE_TOKEN'],
        'repos': [
            "WolffM/hadoku-task",
            "WolffM/hadoku-watchparty",
        ]
    },
    'android-signing': {
        'description': 'Android release signing secrets for hadoku-task-mobile',
        'secrets': [
            'KEYSTORE_BASE64',
            'KEYSTORE_PASSWORD', 
            'KEY_ALIAS',
            'KEY_PASSWORD'
        ],
        'repos': [
            "WolffM/hadoku-task-mobile",
        ]
    },
    'cloudflare': {
        'description': 'Deployment secrets for hadoku_site (Cloudflare Workers)',
        'secrets': [
            'CLOUDFLARE_API_TOKEN', 
            'CLOUDFLARE_WORKER_FLUSH_TOKEN', 
            'ROUTE_CONFIG', 
            'TASK_GITHUB_TOKEN', 
            'DEPLOY_PACKAGE_TOKEN'
        ],
        'repos': [
            "WolffM/hadoku_site",
        ],
        # Map .env names to GitHub Secret names
        'secret_mapping': {
            'TASK_GITHUB_TOKEN': 'HADOKU_SITE_TOKEN',
            'DEPLOY_PACKAGE_TOKEN': 'DEPLOY_PACKAGE_TOKEN'
        }
    }
}

# ============================================================================
# GitHub Token Manager Class
# ============================================================================

class GitHubTokenManager:
    def __init__(self, mode='child-repos'):
        self.token = None
        self.session = None
        self.mode = mode
        self.config = SECRET_CONFIGS.get(mode)
        if not self.config:
            raise ValueError(f"Invalid mode: {mode}. Valid modes: {list(SECRET_CONFIGS.keys())}")
        self.secret_values = {}
        
    def load_env(self) -> Dict[str, str]:
        """Load environment variables from .env file."""
        # Look for .env in the repo root (one level up from scripts/)
        env_path = Path(__file__).parent.parent / '.env'
        env_vars = {}
        
        if env_path.exists():
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env_vars[key.strip()] = value.strip()
        
        return env_vars
    
    def step1_check_token(self) -> bool:
        """Step 1: Check if secrets exist in .env file."""
        print("🔍 Step 1: Checking for secrets in .env file...")
        print(f"  Mode: {self.mode} ({self.config['description']})")
        
        env = self.load_env()
        missing_secrets = []
        secret_mapping = self.config.get('secret_mapping', {})
        
        for secret_name in self.config['secrets']:
            # Check if there's a mapping (e.g., ADMIN_KEY -> PUBLIC_ADMIN_KEY in .env)
            env_name = secret_mapping.get(secret_name, secret_name)
            secret_value = env.get(env_name, '')
            
            if not secret_value:
                missing_secrets.append(f"{secret_name} (looking for {env_name} in .env)")
            else:
                self.secret_values[secret_name] = secret_value
                if env_name != secret_name:
                    print(f"  ✅ Found {secret_name} (from {env_name}): {secret_value[:20]}...")
                else:
                    print(f"  ✅ Found {secret_name}: {secret_value[:20]}...")
        
        if missing_secrets:
            print(f"❌ Missing secrets: {', '.join(missing_secrets)}")
            print("Please add them to your .env file")
            return False
        
        print(f"✅ All {len(self.config['secrets'])} secrets found")
        return True
    
    def step2_validate_token(self) -> bool:
        """Step 2: Validate the secrets."""
        print("\n🔐 Step 2: Validating secrets...")
        
        # For child-repos mode, validate HADOKU_SITE_TOKEN
        if self.mode == 'child-repos' and 'HADOKU_SITE_TOKEN' in self.secret_values:
            token = self.secret_values['HADOKU_SITE_TOKEN']
            
            # Test 1: Token validity (get user info)
            print("  🧪 Testing HADOKU_SITE_TOKEN validity...")
            response = requests.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {token}"},
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"❌ Token validation failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
            
            user_info = response.json()
            print(f"✅ Token valid for user: {user_info.get('login', 'Unknown')}")
            
            # Check token scopes
            scopes = response.headers.get('X-OAuth-Scopes', '')
            if scopes:
                print(f"  📋 Token scopes: {scopes}")
            
            # Test 2: Check repository access
            print("  🧪 Testing repository access...")
            test_repo = self.config['repos'][0]
            response = requests.get(
                f"https://api.github.com/repos/{test_repo}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code != 200:
                print(f"❌ Repository access failed for {test_repo}: {response.status_code}")
                return False
            
            print(f"✅ Repository access confirmed for {test_repo}")
        
        # For cloudflare mode, validate structure
        elif self.mode == 'cloudflare':
            if 'CLOUDFLARE_API_TOKEN' in self.secret_values:
                token = self.secret_values['CLOUDFLARE_API_TOKEN']
                print(f"  ✅ CLOUDFLARE_API_TOKEN present (length: {len(token)})")
            
            if 'ROUTE_CONFIG' in self.secret_values:
                route_config = self.secret_values['ROUTE_CONFIG']
                print("  🧪 Validating ROUTE_CONFIG JSON structure...")
                try:
                    import json
                    config_data = json.loads(route_config)
                    print(f"  ✅ ROUTE_CONFIG is valid JSON with keys: {list(config_data.keys())}")
                except json.JSONDecodeError as e:
                    print(f"  ❌ ROUTE_CONFIG is not valid JSON: {e}")
                    return False
            
            # (Removed: ADMIN_KEYS / FRIEND_KEYS validation. Those arrays were
            #  retired 2026-07-26 — auth resolves from the edge-router key
            #  registry and each key is its own KEY_<TIER>_<NAME> vault item, so
            #  there is nothing to push here as a GitHub secret. The check also
            #  printed `list(keys_data.keys())`, which for the key->userId object
            #  shape meant printing the raw keys to stdout.)

        print("✅ Validation complete")
        return True
    
    def authenticate_github(self) -> bool:
        """Get GitHub token via OAuth Device Flow for API operations."""
        print("\n🔐 Step 3: Getting GitHub API token for secret management...")
        
        # Step 1: Request device code
        device_url = "https://github.com/login/device/code"
        response = requests.post(
            device_url,
            headers={"Accept": "application/json"},
            data={"client_id": CLIENT_ID, "scope": "repo"},
            timeout=REQUEST_TIMEOUT
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get device code: {response.status_code}")
            return False
        
        data = response.json()
        device_code = data["device_code"]
        user_code = data["user_code"]
        verification_uri = data["verification_uri"]
        interval = data["interval"]
        
        print(f"\n📋 Please visit: {verification_uri}")
        print(f"🔑 Enter code: {user_code}")
        print("\nWaiting for authorization (press Ctrl+C to cancel)...")
        
        # Step 2: Poll for access token
        # This is a GitHub OAuth API endpoint URL, not a hardcoded password/token
        token_url = "https://github.com/login/oauth/access_token"  # nosec B105
        while True:
            time.sleep(interval)
            
            response = requests.post(
                token_url,
                headers={"Accept": "application/json"},
                data={
                    "client_id": CLIENT_ID,
                    "device_code": device_code,
                    "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
                },
                timeout=REQUEST_TIMEOUT
            )
            
            result = response.json()
            
            if "access_token" in result:
                print("✅ GitHub API authentication successful!")
                self.token = result["access_token"]
                self.setup_session()
                return True
            elif result.get("error") == "authorization_pending":
                print("⏳ Still waiting...")
                continue
            elif result.get("error") == "slow_down":
                interval += 5
                continue
            else:
                print(f"❌ Authentication failed: {result.get('error_description', result.get('error'))}")
                return False
    
    def setup_session(self):
        """Setup requests session with authentication."""
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"token {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        })
    
    def encrypt_secret(self, public_key: str, secret_value: str) -> str:
        """Encrypt a secret using the repository's public key."""
        public_key_bytes = base64.b64decode(public_key)
        public_key_obj = public.PublicKey(public_key_bytes)
        sealed_box = public.SealedBox(public_key_obj)
        encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
        return base64.b64encode(encrypted).decode("utf-8")
    
    def step3_update_secrets(self) -> bool:
        """Step 4: Update secrets in all target repositories."""
        target_repos = self.config['repos']
        secret_names = self.config['secrets']
        
        print(f"\n📝 Step 4: Updating {len(secret_names)} secret(s) in {len(target_repos)} repository(ies)...")
        
        total_operations = len(target_repos) * len(secret_names)
        success_count = 0
        
        for repo in target_repos:
            print(f"\n  📋 Processing {repo}...")
            
            try:
                # Get public key for this repo
                print("    📥 Getting public key...")
                url = f"https://api.github.com/repos/{repo}/actions/secrets/public-key"
                response = self.session.get(url)
                response.raise_for_status()
                key_data = response.json()
                
                # Update each secret
                for secret_name in secret_names:
                    secret_value = self.secret_values[secret_name]
                    
                    print(f"    🔐 Encrypting {secret_name}...")
                    encrypted_value = self.encrypt_secret(key_data["key"], secret_value)
                    
                    print(f"    📤 Updating {secret_name}...")
                    url = f"https://api.github.com/repos/{repo}/actions/secrets/{secret_name}"
                    payload = {
                        "encrypted_value": encrypted_value,
                        "key_id": key_data["key_id"]
                    }
                    
                    response = self.session.put(url, json=payload)
                    response.raise_for_status()
                    
                    print(f"    ✅ Successfully updated {secret_name} in {repo}")
                    success_count += 1
                
            except requests.exceptions.RequestException as e:
                print(f"    ❌ Failed to update {repo}: {e}")
                if hasattr(e, 'response') and e.response is not None:
                    print(f"    Response: {e.response.text}")
            except Exception as e:
                print(f"    ❌ Unexpected error for {repo}: {e}")
        
        print(f"\n📊 Update Summary: {success_count}/{total_operations} successful")
        return success_count == total_operations
    
    def step4_verify_secrets(self) -> bool:
        """Step 5: Verify that secrets were updated successfully."""
        target_repos = self.config['repos']
        secret_names = self.config['secrets']
        
        print("\n🔍 Step 5: Verifying secret updates...")
        
        total_operations = len(target_repos) * len(secret_names)
        verified_count = 0
        
        for repo in target_repos:
            print(f"\n  📋 Verifying {repo}...")
            
            for secret_name in secret_names:
                try:
                    url = f"https://api.github.com/repos/{repo}/actions/secrets/{secret_name}"
                    response = self.session.get(url)
                    
                    if response.status_code == 200:
                        secret_info = response.json()
                        print(f"    ✅ Secret {secret_name} exists")
                        print(f"       📅 Updated: {secret_info.get('updated_at', 'Unknown')}")
                        verified_count += 1
                    elif response.status_code == 404:
                        print(f"    ❌ Secret {secret_name} not found")
                    else:
                        print(f"    ⚠️  Unexpected response for {secret_name}: {response.status_code}")
                        
                except requests.exceptions.RequestException as e:
                    print(f"    ❌ Failed to verify {secret_name}: {e}")
                except Exception as e:
                    print(f"    ❌ Unexpected error for {secret_name}: {e}")
        
        print(f"\n📊 Verification Summary: {verified_count}/{total_operations} verified")
        return verified_count == total_operations
    
    def run_complete_flow(self) -> bool:
        """Run the complete secret management flow."""
        print("🚀 GitHub Secrets Management - Complete Flow")
        print(f"📋 Mode: {self.mode}")
        print(f"📝 Secrets: {', '.join(self.config['secrets'])}")
        print(f"🎯 Target Repos: {', '.join(self.config['repos'])}")
        print("=" * 60)
        
        # Step 1: Check for token
        if not self.step1_check_token():
            return False
        
        # Step 2: Validate token
        if not self.step2_validate_token():
            return False
        
        # Step 3: Get GitHub API token for secret management
        if not self.authenticate_github():
            return False
        
        # Step 4: Update secrets
        if not self.step3_update_secrets():
            print("⚠️  Some updates failed, but continuing with verification...")
        
        # Step 5: Verify secrets
        verification_success = self.step4_verify_secrets()
        
        print("\n" + "=" * 60)
        if verification_success:
            print("🎉 Complete flow successful! All secrets updated and verified.")
        else:
            print("⚠️  Flow completed with some issues. Check the logs above.")
        
        return verification_success

# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description='Manage GitHub Secrets for hadoku_site repositories',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python manage_github_token.py                    # Update HADOKU_SITE_TOKEN in child repos
  python manage_github_token.py --mode=cloudflare  # Update Cloudflare secrets in hadoku_site
  python manage_github_token.py --mode=all         # Update all secrets in all repos
        """
    )
    
    parser.add_argument(
        '--mode',
        choices=['child-repos', 'android-signing', 'cloudflare', 'all'],
        default='child-repos',
        help='Which secrets to update (default: child-repos)'
    )
    
    args = parser.parse_args()
    
    try:
        # If mode is 'all', run both modes sequentially
        if args.mode == 'all':
            modes = ['child-repos', 'android-signing', 'cloudflare']
        else:
            modes = [args.mode]
        
        all_success = True
        
        for mode in modes:
            if len(modes) > 1:
                print(f"\n{'='*60}")
                print(f"Running mode: {mode}")
                print(f"{'='*60}\n")
            
            manager = GitHubTokenManager(mode=mode)
            success = manager.run_complete_flow()
            
            if not success:
                all_success = False
        
        if all_success:
            print("\n✨ All done! Your GitHub secrets are up to date.")
            sys.exit(0)
        else:
            print("\n❌ There were some issues. Please review the output above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
