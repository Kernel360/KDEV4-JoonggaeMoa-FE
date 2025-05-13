// 지역 타입 정의
export interface Region {
    id: number;
    cortarNo: string;
    centerLat: number;
    centerLon: number;
    cortarName: string;
    areaFull?: string;
    cortarType: string | null;
}

// 선택된 지역 상태 인터페이스
export interface SelectedRegions {
    city: string;
    district: string;
    neighborhoods: string[];
}

/**
 * cortarNo 패턴을 사용하여 시/도 레벨인지 확인
 * 시도: 앞 2자리만 유효하고 나머지는 0 (1100000000, 2600000000 등)
 */
const isSidoLevel = (cortarNo: string): boolean => {
    return cortarNo.substring(2, 5) === '000' && cortarNo.endsWith('00000');
};

/**
 * cortarNo 패턴을 사용하여 구/군 레벨인지 확인
 * 구군: 앞 5자리만 유효하고 나머지는 0 (1156000000, 2641000000 등)
 */
const isSigunguLevel = (cortarNo: string): boolean => {
    return cortarNo.substring(2, 5) !== '000' && cortarNo.substring(5, 8) === '000' && cortarNo.endsWith('00');
};

/**
 * cortarNo 패턴을 사용하여 동/읍/면 레벨인지 확인
 * 동읍면: 앞 8자리가 유효하고 마지막 2자리는 0 (1156010300, 2641017000 등)
 */
const isDongLevel = (cortarNo: string): boolean => {
    return cortarNo.substring(5, 8) !== '000' && cortarNo.endsWith('00');
};

/**
 * 시/도 목록을 필터링합니다.
 * @param regions 전체 지역 목록
 * @returns 시/도 목록
 */
export const filterCities = (regions: Region[]): string[] => {
    if (!regions || regions.length === 0) return [];

    console.log('Filtering cities using cortarNo pattern...');

    // 시도 레벨 지역만 필터링
    const sidoRegions = regions.filter(region =>
        region.cortarNo && region.cortarNo.length === 10 && isSidoLevel(region.cortarNo)
    );

    console.log(`Found ${sidoRegions.length} sido-level regions`);

    // 시도 이름 중복 제거
    const citySet = new Set<string>();
    sidoRegions.forEach(region => {
        if (region.cortarName) {
            citySet.add(region.cortarName);
        }
    });

    // 만약 시도 레벨 지역이 없다면 cortarType을 사용한 대체 방법
    if (citySet.size === 0) {
        console.log('No sido-level regions found by cortarNo pattern, trying cortarType...');
        const cityTypeRegions = regions.filter(r =>
            r.cortarType === 'city' || r.cortarType === '시도'
        );

        cityTypeRegions.forEach(region => {
            if (region.cortarName) {
                citySet.add(region.cortarName);
            }
        });
    }

    const result = Array.from(citySet);
    console.log('Cities found:', result);
    return result;
};

/**
 * 구/군 목록을 필터링합니다.
 * @param regions 전체 지역 목록
 * @param selectedCity 선택된 시/도
 * @returns 구/군 목록
 */
export const filterDistricts = (regions: Region[], selectedCity: string): string[] => {
    if (!regions || regions.length === 0 || !selectedCity) return [];

    console.log('Filtering districts for city:', selectedCity);

    // 선택된 시도 찾기
    const cityRegion = regions.find(region =>
        region.cortarName === selectedCity &&
        region.cortarNo &&
        isSidoLevel(region.cortarNo)
    );

    if (!cityRegion || !cityRegion.cortarNo) {
        console.log('City region not found, trying alternative search...');
        // 이름으로 시도 찾기 시도
        const cityRegions = regions.filter(r => r.cortarName === selectedCity);
        if (cityRegions.length > 0) {
            // 가장 cortarNo가 짧은 것(상위 레벨)을 선택
            cityRegions.sort((a, b) => {
                if (!a.cortarNo) return 1;
                if (!b.cortarNo) return -1;
                return a.cortarNo.localeCompare(b.cortarNo);
            });
            console.log('Found alternative city region:', cityRegions[0]);
            const altCityRegion = cityRegions[0];

            // 하위 구군 찾기
            const districtSet = new Set<string>();
            regions.forEach(region => {
                if (region.cortarNo && altCityRegion.cortarNo &&
                    region.cortarNo.startsWith(altCityRegion.cortarNo.substring(0, 2)) &&
                    isSigunguLevel(region.cortarNo)) {
                    if (region.cortarName) {
                        districtSet.add(region.cortarName);
                    }
                }
            });

            const result = Array.from(districtSet);
            console.log('Districts found (alternative):', result);
            return result;
        }

        console.log('No matching city found at all');
        return [];
    }

    // 시도 코드 추출 (앞 2자리)
    const sidoCode = cityRegion.cortarNo.substring(0, 2);
    console.log('City code:', sidoCode);

    // 선택된 시도에 속하는 구군 레벨 지역 찾기
    const districtSet = new Set<string>();

    regions.forEach(region => {
        if (region.cortarNo &&
            region.cortarNo.startsWith(sidoCode) &&
            isSigunguLevel(region.cortarNo)) {
            if (region.cortarName) {
                districtSet.add(region.cortarName);
            }
        }
    });

    // 결과가 없으면 cortarType으로 시도
    if (districtSet.size === 0) {
        console.log('No districts found by cortarNo pattern, trying cortarType...');
        const districtTypeRegions = regions.filter(r =>
            (r.cortarType === 'dvsn' || r.cortarType === '구군') &&
            r.cortarName
        );

        districtTypeRegions.forEach(region => {
            if (region.cortarName) {
                districtSet.add(region.cortarName);
            }
        });
    }

    const result = Array.from(districtSet);
    console.log('Districts found:', result);
    return result;
};

/**
 * 동/읍/면 목록을 필터링합니다.
 * @param regions 전체 지역 목록
 * @param selectedCity 선택된 시/도
 * @param selectedDistrict 선택된 구/군
 * @returns 동/읍/면 목록
 */
export const filterNeighborhoods = (
    regions: Region[],
    selectedCity: string,
    selectedDistrict: string
): string[] => {
    if (!regions || regions.length === 0 || !selectedCity || !selectedDistrict) return [];

    console.log('Filtering neighborhoods for district:', selectedDistrict);

    // 선택된 시도 찾기
    const cityRegion = regions.find(region =>
        region.cortarName === selectedCity &&
        region.cortarNo &&
        isSidoLevel(region.cortarNo)
    );

    if (!cityRegion || !cityRegion.cortarNo) {
        console.log('City region not found for neighborhoods');
        return [];
    }

    // 시도 코드 추출 (앞 2자리)
    const sidoCode = cityRegion.cortarNo.substring(0, 2);

    // 선택된 구군 찾기
    const districtRegion = regions.find(region =>
        region.cortarName === selectedDistrict &&
        region.cortarNo &&
        region.cortarNo.startsWith(sidoCode) &&
        isSigunguLevel(region.cortarNo)
    );

    if (!districtRegion || !districtRegion.cortarNo) {
        console.log('District region not found for neighborhoods');
        return [];
    }

    // 구군 코드 추출 (앞 5자리)
    const sigunguCode = districtRegion.cortarNo.substring(0, 5);
    console.log('Sigungu code:', sigunguCode);

    // 선택된 구군에 속하는 동읍면 레벨 지역 찾기
    const neighborhoods: string[] = [];

    regions.forEach(region => {
        if (region.cortarNo &&
            region.cortarNo.startsWith(sigunguCode) &&
            isDongLevel(region.cortarNo) &&
            region.cortarName &&
            !neighborhoods.includes(region.cortarName)) {
            neighborhoods.push(region.cortarName);
        }
    });

    // 결과가 없으면 cortarType으로 시도
    if (neighborhoods.length === 0) {
        console.log('No neighborhoods found by cortarNo pattern, trying cortarType...');
        const dongTypeRegions = regions.filter(r =>
            (r.cortarType === 'sec' || r.cortarType === 'dong') &&
            r.cortarName
        );

        dongTypeRegions.forEach(region => {
            if (region.cortarName && !neighborhoods.includes(region.cortarName)) {
                neighborhoods.push(region.cortarName);
            }
        });
    }

    console.log('Neighborhoods found:', neighborhoods);
    return neighborhoods;
};

/**
 * 선택된 지역에 해당하는 중심 좌표를 찾습니다.
 * @param regions 전체 지역 목록
 * @param selectedRegions 선택된 지역 정보
 * @returns 중심 좌표를 가진 지역 객체 또는 undefined
 */
export const findCenterForSelectedRegion = (
    regions: Region[],
    selectedRegions: SelectedRegions
): Region | undefined => {
    if (!regions || regions.length === 0) return undefined;

    let targetRegion: Region | undefined;

    if (selectedRegions.neighborhoods.length > 0) {
        // 선택된 동이 있으면 해당 동의 중심점으로 이동
        const neighborhood = selectedRegions.neighborhoods[0];
        targetRegion = regions.find(r => r.cortarName === neighborhood);
    } else if (selectedRegions.district) {
        // 선택된 구가 있으면 해당 구의 중심점으로 이동
        targetRegion = regions.find(r => r.cortarName === selectedRegions.district);
    } else if (selectedRegions.city) {
        // 선택된 시가 있으면 해당 시의 중심점으로 이동
        targetRegion = regions.find(r => r.cortarName === selectedRegions.city);
    }

    return targetRegion;
}; 