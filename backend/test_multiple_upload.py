#!/usr/bin/env python3
"""
Test script for multiple file upload feature
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_models():
    """Test that models are properly defined"""
    print("\n=== Testing Models ===")
    try:
        from app.models import Message, Attachment
        
        print("✓ Message model imported successfully")
        print("✓ Attachment model imported successfully")
        
        # Check Message has attachments relationship
        if hasattr(Message, 'attachments'):
            print("✓ Message.attachments relationship exists")
        else:
            print("✗ Message.attachments relationship missing")
            return False
            
        # Check Attachment model fields
        required_fields = ['id', 'message_id', 'file_url', 'file_name', 'file_type', 'file_size', 'created_at']
        attachment_columns = [col.name for col in Attachment.__table__.columns]
        
        for field in required_fields:
            if field in attachment_columns:
                print(f"✓ Attachment.{field} exists")
            else:
                print(f"✗ Attachment.{field} missing")
                return False
                
        return True
    except Exception as e:
        print(f"✗ Error testing models: {e}")
        return False

def test_schemas():
    """Test that schemas are properly defined"""
    print("\n=== Testing Schemas ===")
    try:
        from app.schemas import AttachmentResponse, MessageWithSender
        
        print("✓ AttachmentResponse schema imported successfully")
        print("✓ MessageWithSender schema imported successfully")
        
        # Check MessageWithSender has attachments field
        if 'attachments' in MessageWithSender.model_fields:
            print("✓ MessageWithSender.attachments field exists")
        else:
            print("✗ MessageWithSender.attachments field missing")
            return False
            
        return True
    except Exception as e:
        print(f"✗ Error testing schemas: {e}")
        return False

def test_database_table():
    """Test that attachments table exists"""
    print("\n=== Testing Database ===")
    try:
        from app.core.database import engine
        from sqlalchemy import text, inspect
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'attachments' in tables:
            print("✓ Attachments table exists")
            
            # Check columns
            columns = inspector.get_columns('attachments')
            column_names = [col['name'] for col in columns]
            
            required_columns = ['id', 'message_id', 'file_url', 'file_name', 'file_type', 'file_size', 'created_at']
            for col in required_columns:
                if col in column_names:
                    print(f"✓ Column '{col}' exists")
                else:
                    print(f"✗ Column '{col}' missing")
                    return False
                    
            # Check indexes
            indexes = inspector.get_indexes('attachments')
            index_names = [idx['name'] for idx in indexes]
            
            if 'idx_attachments_message_id' in index_names or any('message_id' in idx['name'] for idx in indexes):
                print("✓ Index on message_id exists")
            else:
                print("⚠ Warning: Index on message_id not found (optional but recommended)")
                
            return True
        else:
            print("✗ Attachments table does not exist")
            print("   Run: python3 apply_migration.py")
            return False
            
    except Exception as e:
        print(f"✗ Error testing database: {e}")
        return False

def test_file_structure():
    """Test that all required files exist"""
    print("\n=== Testing File Structure ===")
    
    required_files = [
        'app/models/attachment.py',
        'app/schemas/attachment.py',
        'apply_migration.py',
        'create_attachments_table.sql'
    ]
    
    all_exist = True
    for file_path in required_files:
        full_path = os.path.join(os.path.dirname(__file__), file_path)
        if os.path.exists(full_path):
            print(f"✓ {file_path} exists")
        else:
            print(f"✗ {file_path} missing")
            all_exist = False
            
    return all_exist

def main():
    """Run all tests"""
    print("=" * 60)
    print("Multiple File Upload Feature - Test Suite")
    print("=" * 60)
    
    results = []
    
    # Test file structure
    results.append(("File Structure", test_file_structure()))
    
    # Test models
    results.append(("Models", test_models()))
    
    # Test schemas
    results.append(("Schemas", test_schemas()))
    
    # Test database
    results.append(("Database", test_database_table()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{test_name:20} {status}")
    
    print("=" * 60)
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Feature is ready to use.")
        print("\nNext steps:")
        print("1. Start the backend server")
        print("2. Start the frontend server")
        print("3. Test multiple file upload in the UI")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
