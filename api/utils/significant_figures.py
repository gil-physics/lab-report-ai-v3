"""
Significant Figures Utility Functions
Handles automatic significant figure formatting and uncertainty propagation
"""
from uncertainties import ufloat
import sigfig


def format_with_uncertainty(value: float, error: float, sig_figs: int = 2) -> str:
    """
    Format a value with its uncertainty according to significant figure rules
    
    Args:
        value: The measurement value
        error: The uncertainty/error
        sig_figs: Number of significant figures for the error (default: 2)
        
    Returns:
        Formatted string like "9.81 ± 0.12"
    """
    try:
        # Round error to sig_figs significant figures
        rounded_error = sigfig.round(error, sigfigs=sig_figs)
        
        # Determine decimal places from error
        if rounded_error == 0:
            return f"{value:.4f} ± 0"
        
        # Get decimal place of last significant digit in error
        error_magnitude = abs(rounded_error)
        decimal_places = max(0, -int(f"{error_magnitude:e}".split('e')[1]) + sig_figs - 1)
        
        # Round value to same decimal place as error
        rounded_value = round(value, decimal_places)
        
        return f"{rounded_value:.{decimal_places}f} ± {rounded_error:.{decimal_places}f}"
    
    except Exception:
        # Fallback to simple formatting
        return f"{value:.4f} ± {error:.4f}"


def format_value_sigfigs(value: float, sig_figs: int = 3) -> str:
    """
    Format a single value to a specified number of significant figures
    
    Args:
        value: The value to format
        sig_figs: Number of significant figures
        
    Returns:
        Formatted string
    """
    try:
        return str(sigfig.round(value, sigfigs=sig_figs))
    except Exception:
        return f"{value:.{sig_figs}g}"


def propagate_uncertainty(measurements: list[float]) -> dict:
    """
    Calculate mean and propagated uncertainty from a list of measurements
    
    Args:
        measurements: List of measurement values
        
    Returns:
        Dictionary with 'mean', 'std', 'uncertainty', and 'formatted' string
    """
    import numpy as np
    
    if len(measurements) == 0:
        return {
            "mean": 0,
            "std": 0,
            "uncertainty": 0,
            "formatted": "N/A"
        }
    
    mean_val = np.mean(measurements)
    std_val = np.std(measurements, ddof=1) if len(measurements) > 1 else 0
    
    # Standard error of the mean
    uncertainty = std_val / np.sqrt(len(measurements)) if len(measurements) > 1 else std_val
    
    formatted = format_with_uncertainty(mean_val, uncertainty, sig_figs=2)
    
    return {
        "mean": float(mean_val),
        "std": float(std_val),
        "uncertainty": float(uncertainty),
        "formatted": formatted
    }


def apply_multiplication_rule(values_with_errors: list[tuple[float, float]]) -> tuple[float, float]:
    """
    Apply multiplication rule for significant figures
    In multiplication/division, result has same number of sig figs as least precise input
    
    Args:
        values_with_errors: List of (value, relative_error) tuples
        
    Returns:
        (result, result_error) tuple
    """
    from uncertainties import ufloat
    import numpy as np
    
    # Create ufloat objects
    uncertainties_values = [ufloat(val, err) for val, err in values_with_errors]
    
    # Multiply all values
    result = np.prod(uncertainties_values)
    
    return (result.nominal_value, result.std_dev)


def count_sig_figs(value: str) -> int:
    """
    Count the number of significant figures in a string representation of a number
    
    Args:
        value: String representation of a number
        
    Returns:
        Number of significant figures
    """
    # Remove leading/trailing whitespace
    value = value.strip()
    
    # Remove scientific notation
    if 'e' in value.lower():
        mantissa = value.lower().split('e')[0]
        value = mantissa
    
    # Remove decimal point for counting
    value_no_decimal = value.replace('.', '')
    
    # Remove leading zeros
    value_no_decimal = value_no_decimal.lstrip('0')
    
    # If decimal point exists and there are trailing zeros after it, they count
    if '.' in value:
        # All non-zero digits and zeros between/after them count
        return len(value_no_decimal)
    else:
        # Trailing zeros in whole numbers don't count unless explicitly shown
        return len(value_no_decimal.rstrip('0'))
