#!/usr/bin/env python3
"""
Script to create a super admin user
Usage: python create_superadmin.py
"""
import sys
from getpass import getpass
from app.core import get_db, get_password_hash
from app.models import User
from app.models.user import UserRole

def create_super_admin():
    print("=== Create Super Admin User ===\n")
    
    # Get user input
    username = input("Username: ").strip()
    if not username:
        print("Error: Username cannot be empty")
        return
    
    email = input("Email: ").strip()
    if not email:
        print("Error: Email cannot be empty")
        return
    
    password = getpass("Password: ")
    if not password:
        print("Error: Password cannot be empty")
        return
    
    password_confirm = getpass("Confirm Password: ")
    if password != password_confirm:
        print("Error: Passwords do not match")
        return
    
    full_name = input("Full Name (optional): ").strip() or None
    
    # Create database session
    db = next(get_db())
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"\nError: User with username '{username}' or email '{email}' already exists")
            
            # Ask if want to promote existing user
            promote = input(f"Do you want to promote '{existing_user.username}' to super admin? (yes/no): ").lower()
            if promote in ['yes', 'y']:
                existing_user.role = UserRole.SUPER_ADMIN
                db.commit()
                print(f"\n✓ User '{existing_user.username}' has been promoted to super admin!")
            return
        
        # Create new super admin user
        hashed_password = get_password_hash(password)
        super_admin = User(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        
        print(f"\n✓ Super admin user created successfully!")
        print(f"  Username: {super_admin.username}")
        print(f"  Email: {super_admin.email}")
        print(f"  Role: {super_admin.role.value}")
        print(f"\nYou can now login with these credentials.")
        
    except Exception as e:
        print(f"\nError creating super admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_super_admin()
