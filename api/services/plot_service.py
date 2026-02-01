import matplotlib
matplotlib.use('Agg')  # Non-GUI backend
import matplotlib.pyplot as plt
import base64
from io import BytesIO
import platform

# Font configuration
system_os = platform.system()
if system_os == "Windows":
    plt.rcParams['font.family'] = 'Malgun Gothic'
elif system_os == "Darwin":
    plt.rcParams['font.family'] = 'AppleGothic'
else:
    plt.rcParams['font.family'] = 'NanumGothic'
plt.rcParams['axes.unicode_minus'] = False


def generate_plot_buffer(x_data, y_data, y_pred=None, x_label='X', y_label='Y', title='Plot', x_range=None, y_range=None, color='#3b82f6', is_log=False) -> BytesIO:
    """Generates a matplotlib plot and returns it as a BytesIO buffer for upload."""
    plt.figure(figsize=(8, 6))
    plt.scatter(x_data, y_data, alpha=0.6, s=50, c=color, label='실험 데이터', edgecolors='white', linewidth=0.5)
    
    if y_pred is not None:
        plt.plot(x_data, y_pred, 'r-', linewidth=2, label='피팅된 곡선', alpha=0.8)
    
    plt.xlabel(x_label, fontsize=12, fontweight='bold')
    plt.ylabel(y_label, fontsize=12, fontweight='bold')
    plt.title(title, fontsize=14, fontweight='bold', pad=15)
    
    if x_range and len(x_range) == 2:
        if x_range[0] not in ["", None]: plt.xlim(left=float(x_range[0]))
        if x_range[1] not in ["", None]: plt.xlim(right=float(x_range[1]))
    if y_range and len(y_range) == 2:
        if y_range[0] not in ["", None]: plt.ylim(bottom=float(y_range[0]))
        if y_range[1] not in ["", None]: plt.ylim(top=float(y_range[1]))

    if is_log:
        import numpy as np
        x_check = np.array(x_data)
        y_check = np.array(y_data)
        if np.all(x_check > 0): plt.xscale('log')
        if np.all(y_check > 0): plt.yscale('log')

    plt.legend(loc='best', frameon=True, shadow=True)
    plt.grid(True, alpha=0.3, linestyle='--')
    plt.tight_layout()
    
    buf = BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    return buf


def generate_residual_plot_buffer(x_data, residuals, x_label='X', y_label='Y', title='잔차 분석', x_range=None) -> BytesIO:
    """Generates a residual plot and returns it as a BytesIO buffer for upload."""
    plt.figure(figsize=(8, 6))
    plt.scatter(x_data, residuals, alpha=0.6, s=50, c='#8b5cf6', edgecolors='white', linewidth=0.5, label='잔차')
    plt.axhline(y=0, color='r', linestyle='--', linewidth=2, alpha=0.7, label='Y = 0')
    
    plt.xlabel(x_label, fontsize=12, fontweight='bold')
    plt.ylabel(f'{y_label} 잔차', fontsize=12, fontweight='bold')
    plt.title(title, fontsize=14, fontweight='bold', pad=15)
    
    if x_range and len(x_range) == 2:
        if x_range[0] not in ["", None]: plt.xlim(left=float(x_range[0]))
        if x_range[1] not in ["", None]: plt.xlim(right=float(x_range[1]))

    plt.legend(loc='best', frameon=True, shadow=True)
    plt.grid(True, alpha=0.3, linestyle='--')
    plt.tight_layout()
    
    buf = BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    return buf


def generate_plot_file(x_data, y_data, save_path, y_pred=None, x_label='X', y_label='Y', title='Plot', x_range=None, y_range=None, color='#3b82f6', is_log=False):
    """Generates a matplotlib plot and saves it to a file."""
    plt.figure(figsize=(8, 6))
    plt.scatter(x_data, y_data, alpha=0.6, s=50, c=color, label='실험 데이터', edgecolors='white', linewidth=0.5)
    
    if y_pred is not None:
        plt.plot(x_data, y_pred, 'r-', linewidth=2, label='피팅된 곡선', alpha=0.8)
    
    plt.xlabel(x_label, fontsize=12, fontweight='bold')
    plt.ylabel(y_label, fontsize=12, fontweight='bold')
    plt.title(title, fontsize=14, fontweight='bold', pad=15)
    
    # Apply ranges
    if x_range and len(x_range) == 2:
        if x_range[0] not in ["", None]: plt.xlim(left=float(x_range[0]))
        if x_range[1] not in ["", None]: plt.xlim(right=float(x_range[1]))
    if y_range and len(y_range) == 2:
        if y_range[0] not in ["", None]: plt.ylim(bottom=float(y_range[0]))
        if y_range[1] not in ["", None]: plt.ylim(top=float(y_range[1]))

    plt.legend(loc='best', frameon=True, shadow=True)
    plt.grid(True, alpha=0.3, linestyle='--')
    plt.tight_layout()
    
    # Save to file
    plt.savefig(save_path, format='png', dpi=100, bbox_inches='tight')
    plt.close()
    return True

def generate_plot_base64(x_data, y_data, y_pred=None, x_label='X', y_label='Y', title='Plot', x_range=None, y_range=None, color='#3b82f6', is_log=False):
    """Generates a matplotlib plot and returns it as a Base64 encoded PNG string."""
    plt.figure(figsize=(8, 6))
    plt.scatter(x_data, y_data, alpha=0.6, s=50, c=color, label='실험 데이터', edgecolors='white', linewidth=0.5)
    
    if y_pred is not None:
        plt.plot(x_data, y_pred, 'r-', linewidth=2, label='피팅된 곡선', alpha=0.8)
    
    plt.xlabel(x_label, fontsize=12, fontweight='bold')
    plt.ylabel(y_label, fontsize=12, fontweight='bold')
    plt.title(title, fontsize=14, fontweight='bold', pad=15)
    
    # Apply ranges
    if x_range and len(x_range) == 2:
        if x_range[0] not in ["", None]: plt.xlim(left=float(x_range[0]))
        if x_range[1] not in ["", None]: plt.xlim(right=float(x_range[1]))
    if y_range and len(y_range) == 2:
        if y_range[0] not in ["", None]: plt.ylim(bottom=float(y_range[0]))
        if y_range[1] not in ["", None]: plt.ylim(top=float(y_range[1]))

    plt.legend(loc='best', frameon=True, shadow=True)
    plt.grid(True, alpha=0.3, linestyle='--')

    if is_log:
        import numpy as np
        x_check = np.array(x_data)
        y_check = np.array(y_data)
        if np.all(x_check > 0): plt.xscale('log')
        if np.all(y_check > 0): plt.yscale('log')

    plt.tight_layout()
    
    # Save to buffer
    buf = BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight') # Reduced DPI for Base64 (web use)
    plt.close()
    buf.seek(0)
    
    # Encode to Base64
    base64_str = base64.b64encode(buf.read()).decode('utf-8')
    return f"data:image/png;base64,{base64_str}"

def generate_residual_plot_base64(x_data, residuals, x_label='X', y_label='Y', title='Residual Plot', x_range=None):
    """Generates a residual plot and returns it as a Base64 encoded PNG string."""
    plt.figure(figsize=(8, 6))
    plt.scatter(x_data, residuals, alpha=0.6, s=50, c='#8b5cf6', edgecolors='white', linewidth=0.5)
    plt.axhline(y=0, color='r', linestyle='--', linewidth=2, alpha=0.7, label='Y = 0')
    
    plt.xlabel(x_label, fontsize=12, fontweight='bold')
    plt.ylabel(f'{y_label} 잔차', fontsize=12, fontweight='bold')
    plt.title(title, fontsize=14, fontweight='bold', pad=15)
    
    if x_range and len(x_range) == 2:
        if x_range[0] not in ["", None]: plt.xlim(left=float(x_range[0]))
        if x_range[1] not in ["", None]: plt.xlim(right=float(x_range[1]))

    plt.legend(loc='best', frameon=True, shadow=True)
    plt.grid(True, alpha=0.3, linestyle='--')
    plt.tight_layout()
    
    # Save to buffer
    buf = BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    plt.close()
    buf.seek(0)
    
    # Encode to Base64
    base64_str = base64.b64encode(buf.read()).decode('utf-8')
    return f"data:image/png;base64,{base64_str}"
def generate_residual_plot_file(x_data, residuals, save_path, x_label='X', y_label='Y', title='잔차 분석', x_range=None):
    """Generates a residual plot and saves it to a file."""
    plt.figure(figsize=(8, 6))
    plt.scatter(x_data, residuals, alpha=0.6, s=50, c='#8b5cf6', edgecolors='white', linewidth=0.5, label='잔차')
    plt.axhline(y=0, color='r', linestyle='--', linewidth=2, alpha=0.7, label='Y = 0')
    
    plt.xlabel(x_label, fontsize=12, fontweight='bold')
    plt.ylabel(f'{y_label} 잔차', fontsize=12, fontweight='bold')
    plt.title(title, fontsize=14, fontweight='bold', pad=15)
    
    if x_range and len(x_range) == 2:
        if x_range[0] not in ["", None]: plt.xlim(left=float(x_range[0]))
        if x_range[1] not in ["", None]: plt.xlim(right=float(x_range[1]))

    plt.legend(loc='best', frameon=True, shadow=True)
    plt.grid(True, alpha=0.3, linestyle='--')
    plt.tight_layout()
    
    plt.savefig(save_path, format='png', dpi=100, bbox_inches='tight')
    plt.close()
    return True
