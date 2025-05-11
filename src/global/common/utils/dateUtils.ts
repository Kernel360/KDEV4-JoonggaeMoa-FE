/**
 * 날짜 문자열을 포맷팅하는 유틸리티 함수
 * @param dateString - 포맷팅할 날짜 문자열
 * @returns 포맷팅된 날짜 문자열 (YYYY.MM.DD)
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return "-";

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}.${month}.${day}`;
    } catch (error) {
        console.error("날짜 포맷팅 오류:", error);
        return dateString;
    }
}; 