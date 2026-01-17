export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    if (!password) return { isValid: false, message: 'Vui lòng nhập mật khẩu' };
    if (password.length < 6) return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
    return { isValid: true, message: '' };
};

export const validateUsername = (username) => {
    if (!username) return { isValid: false, message: 'Vui lòng nhập tên người dùng' };
    if (username.length < 3) return { isValid: false, message: 'Tên người dùng phải có ít nhất 3 ký tự' };
    return { isValid: true, message: '' };
};
