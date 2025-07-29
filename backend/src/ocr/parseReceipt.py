#!/usr/bin/env python3
"""
Receipt OCR Parser
Uses pytesseract and OpenCV to extract merchant name, amount, and date from receipts.
"""

import sys
import json
import re
import cv2
import pytesseract
from datetime import datetime
from typing import Dict, Optional, List


def preprocess_image(image_path: str) -> any:
    """
    Preprocess the image for better OCR results.
    """
    try:
        # Read the image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image from {image_path}")
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply noise reduction
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Apply thresholding to get binary image
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return thresh
    except Exception as e:
        print(f"Error preprocessing image: {str(e)}", file=sys.stderr)
        return None


def extract_text_from_image(image_path: str) -> str:
    """
    Extract text from the receipt image using OCR.
    """
    try:
        # Preprocess the image
        processed_image = preprocess_image(image_path)
        if processed_image is None:
            return ""
        
        # Configure tesseract
        custom_config = r'--oem 3 --psm 6'
        
        # Extract text
        text = pytesseract.image_to_string(processed_image, config=custom_config)
        return text.strip()
    except Exception as e:
        print(f"Error extracting text: {str(e)}", file=sys.stderr)
        return ""


def extract_amounts(text: str) -> List[float]:
    """
    Extract potential monetary amounts from text.
    """
    # Pattern to match currency amounts (supports $, €, £, and plain numbers)
    amount_patterns = [
        r'\$\s*(\d+(?:\.\d{2})?)',  # $123.45 or $ 123.45
        r'(\d+\.\d{2})\s*\$',       # 123.45$
        r'€\s*(\d+(?:\.\d{2})?)',   # €123.45
        r'£\s*(\d+(?:\.\d{2})?)',   # £123.45
        r'\b(\d+\.\d{2})\b',        # Plain 123.45 format
        r'\b(\d+,\d{3}\.\d{2})\b',  # 1,234.56 format
    ]
    
    amounts = []
    for pattern in amount_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            try:
                # Handle comma separated thousands
                amount_str = match.replace(',', '')
                amount = float(amount_str)
                # Filter out unrealistic amounts (too small or too large)
                if 0.01 <= amount <= 10000:
                    amounts.append(amount)
            except ValueError:
                continue
    
    return amounts


def extract_merchant_name(text: str) -> Optional[str]:
    """
    Extract the merchant name, typically found in the first few lines.
    """
    lines = text.split('\n')
    
    # Look for merchant name in the first 5 lines
    for i, line in enumerate(lines[:5]):
        line = line.strip()
        
        # Skip empty lines or lines with only numbers/symbols
        if not line or re.match(r'^[\d\s\-\.\,\$\€\£\(\)]+$', line):
            continue
            
        # Skip common receipt headers/footers
        skip_words = ['receipt', 'invoice', 'bill', 'ticket', 'date', 'time', 'tax', 'total', 'subtotal']
        if any(word in line.lower() for word in skip_words):
            continue
            
        # If line has reasonable length and contains letters
        if 3 <= len(line) <= 50 and re.search(r'[a-zA-Z]', line):
            # Clean up the merchant name
            merchant = re.sub(r'[^\w\s\&\-\.]', '', line).strip()
            if merchant:
                return merchant
    
    return None


def extract_date(text: str) -> Optional[str]:
    """
    Extract date from receipt text.
    """
    # Common date patterns
    date_patterns = [
        r'\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b',  # MM/DD/YYYY or DD/MM/YYYY
        r'\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b',    # YYYY/MM/DD
        r'\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})\b',  # 15 Jan 2024
    ]
    
    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            try:
                if len(match) == 3:
                    # Try to parse the date
                    if match[1].isalpha():  # Month name format
                        date_str = f"{match[0]} {match[1]} {match[2]}"
                        parsed_date = datetime.strptime(date_str, "%d %b %Y")
                    else:
                        # Numeric format - assume MM/DD/YYYY for US receipts
                        year = int(match[2])
                        if year < 100:  # Two-digit year
                            year += 2000
                        parsed_date = datetime(year, int(match[0]), int(match[1]))
                    
                    # Return in ISO format
                    return parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                continue
    
    return None


def parse_receipt(image_path: str) -> Dict[str, any]:
    """
    Main function to parse receipt and extract relevant information.
    """
    try:
        # Extract text from image
        raw_text = extract_text_from_image(image_path)
        
        if not raw_text:
            return {
                "success": False,
                "error": "Could not extract text from image",
                "raw_text": "",
                "merchant": None,
                "total": None,
                "date": None
            }
        
        # Extract information
        amounts = extract_amounts(raw_text)
        merchant = extract_merchant_name(raw_text)
        date = extract_date(raw_text)
        
        # Find the most likely total (usually the largest amount)
        total = max(amounts) if amounts else None
        
        return {
            "success": True,
            "error": None,
            "raw_text": raw_text,
            "merchant": merchant,
            "total": total,
            "date": date,
            "all_amounts": amounts  # For debugging
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "raw_text": "",
            "merchant": None,
            "total": None,
            "date": None
        }


def main():
    """
    Main entry point for the script.
    Expected usage: python parseReceipt.py <image_path>
    """
    if len(sys.argv) != 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python parseReceipt.py <image_path>",
            "raw_text": "",
            "merchant": None,
            "total": None,
            "date": None
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = parse_receipt(image_path)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
