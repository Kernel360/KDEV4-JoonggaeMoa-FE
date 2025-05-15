
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import { 
  Box,
  CircularProgress, 
  Typography,
  Button,
  Paper,
  Divider
} from '@mui/material';
import React, { useState, useCallback } from 'react';

import { fetchRegionsAPI } from '../services/articleApi';

// 기존 Region 타입과 충돌을 방지하기 위해 새로운 이름의 타입 정의
interface RegionItem {
  bjd_code: string;
  address: string;
  category: string;
  latitude?: number;
  longitude?: number;
  zoomLevel?: number;
}

const CITIES: RegionItem[] = [
  { bjd_code: '1100000000', address: '서울시', category: 'city', latitude: 37.566427, longitude: 126.977872, zoomLevel: 8 },
  { bjd_code: '4100000000', address: '경기도', category: 'city', latitude: 37.274939, longitude: 127.008689, zoomLevel: 9 },
  { bjd_code: '2800000000', address: '인천시', category: 'city', latitude: 37.456054, longitude: 126.705151, zoomLevel: 8 },
  { bjd_code: '2600000000', address: '부산시', category: 'city', latitude: 35.180143, longitude: 129.075413, zoomLevel: 8 },
  { bjd_code: '3000000000', address: '대전시', category: 'city', latitude: 36.350465, longitude: 127.384953, zoomLevel: 8 },
  { bjd_code: '2700000000', address: '대구시', category: 'city', latitude: 35.87139, longitude: 128.601763, zoomLevel: 8 },
  { bjd_code: '3100000000', address: '울산시', category: 'city', latitude: 35.5386, longitude: 129.311375, zoomLevel: 8 },
  { bjd_code: '3600000000', address: '세종시', category: 'city', latitude: 36.592907, longitude: 127.292375, zoomLevel: 8 },
  { bjd_code: '2900000000', address: '광주시', category: 'city', latitude: 35.160032, longitude: 126.851338, zoomLevel: 8 },
  { bjd_code: '5100000000', address: '강원도', category: 'city', latitude: 37.885399, longitude: 127.72975, zoomLevel: 9 },
  { bjd_code: '4300000000', address: '충청북도', category: 'city', latitude: 36.636149, longitude: 127.491238, zoomLevel: 9 },
  { bjd_code: '4400000000', address: '충청남도', category: 'city', latitude: 36.63629, longitude: 126.68957, zoomLevel: 9 },
  { bjd_code: '4700000000', address: '경상북도', category: 'city', latitude: 36.518504, longitude: 128.437796, zoomLevel: 9 },
  { bjd_code: '4800000000', address: '경상남도', category: 'city', latitude: 35.238343, longitude: 128.6924, zoomLevel: 9 },
  { bjd_code: '5200000000', address: '전북도', category: 'city', latitude: 35.820433, longitude: 127.108875, zoomLevel: 9 },
  { bjd_code: '4600000000', address: '전라남도', category: 'city', latitude: 34.816358, longitude: 126.462443, zoomLevel: 9 },
  { bjd_code: '5000000000', address: '제주도', category: 'city', latitude: 33.488976, longitude: 126.498238, zoomLevel: 9 },
];

const DISTRICTS_IN_CITIES: { [cityCodePrefix: string]: RegionItem[] } = {
  // 서울시 (11)
  '11': [
    { bjd_code: '1168000000', address: '강남구', category: 'dvsn' },
    { bjd_code: '1174000000', address: '강동구', category: 'dvsn' },
    { bjd_code: '1130500000', address: '강북구', category: 'dvsn' },
    { bjd_code: '1150000000', address: '강서구', category: 'dvsn' },
    { bjd_code: '1162000000', address: '관악구', category: 'dvsn' },
    { bjd_code: '1121500000', address: '광진구', category: 'dvsn' },
    { bjd_code: '1153000000', address: '구로구', category: 'dvsn' },
    { bjd_code: '1154500000', address: '금천구', category: 'dvsn' },
    { bjd_code: '1135000000', address: '노원구', category: 'dvsn' },
    { bjd_code: '1132000000', address: '도봉구', category: 'dvsn' },
    { bjd_code: '1123000000', address: '동대문구', category: 'dvsn' },
    { bjd_code: '1159000000', address: '동작구', category: 'dvsn' },
    { bjd_code: '1144000000', address: '마포구', category: 'dvsn' },
    { bjd_code: '1141000000', address: '서대문구', category: 'dvsn' },
    { bjd_code: '1165000000', address: '서초구', category: 'dvsn' },
    { bjd_code: '1120000000', address: '성동구', category: 'dvsn' },
    { bjd_code: '1129000000', address: '성북구', category: 'dvsn' },
    { bjd_code: '1171000000', address: '송파구', category: 'dvsn' },
    { bjd_code: '1147000000', address: '양천구', category: 'dvsn' },
    { bjd_code: '1156000000', address: '영등포구', category: 'dvsn' },
    { bjd_code: '1117000000', address: '용산구', category: 'dvsn' },
    { bjd_code: '1138000000', address: '은평구', category: 'dvsn' },
    { bjd_code: '1111000000', address: '종로구', category: 'dvsn' },
    { bjd_code: '1114000000', address: '중구', category: 'dvsn' },
    { bjd_code: '1126000000', address: '중랑구', category: 'dvsn' },
  ],
  // 경기도 (41)
  '41': [
    { bjd_code: '4182000000', address: '가평군', category: 'dvsn' },
    { bjd_code: '4128100000', address: '고양시 덕양구', category: 'dvsn' },
    { bjd_code: '4128500000', address: '고양시 일산동구', category: 'dvsn' },
    { bjd_code: '4128700000', address: '고양시 일산서구', category: 'dvsn' },
    { bjd_code: '4129000000', address: '과천시', category: 'dvsn' },
    { bjd_code: '4121000000', address: '광명시', category: 'dvsn' },
    { bjd_code: '4161000000', address: '광주시', category: 'dvsn' },
    { bjd_code: '4131000000', address: '구리시', category: 'dvsn' },
    { bjd_code: '4141000000', address: '군포시', category: 'dvsn' },
    { bjd_code: '4157000000', address: '김포시', category: 'dvsn' },
    { bjd_code: '4136000000', address: '남양주시', category: 'dvsn' },
    { bjd_code: '4125000000', address: '동두천시', category: 'dvsn' },
    { bjd_code: '4119000000', address: '부천시', category: 'dvsn' }, // 부천시는 2024년 구제 폐지, 대표 코드로 통합 가정
    { bjd_code: '4113100000', address: '성남시 수정구', category: 'dvsn' },
    { bjd_code: '4113300000', address: '성남시 중원구', category: 'dvsn' },
    { bjd_code: '4113500000', address: '성남시 분당구', category: 'dvsn' },
    { bjd_code: '4111100000', address: '수원시 장안구', category: 'dvsn' },
    { bjd_code: '4111300000', address: '수원시 권선구', category: 'dvsn' },
    { bjd_code: '4111500000', address: '수원시 팔달구', category: 'dvsn' },
    { bjd_code: '4111700000', address: '수원시 영통구', category: 'dvsn' },
    { bjd_code: '4139000000', address: '시흥시', category: 'dvsn' },
    { bjd_code: '4127100000', address: '안산시 상록구', category: 'dvsn' },
    { bjd_code: '4127300000', address: '안산시 단원구', category: 'dvsn' },
    { bjd_code: '4155000000', address: '안성시', category: 'dvsn' },
    { bjd_code: '4117100000', address: '안양시 만안구', category: 'dvsn' },
    { bjd_code: '4117300000', address: '안양시 동안구', category: 'dvsn' },
    { bjd_code: '4163000000', address: '양주시', category: 'dvsn' },
    { bjd_code: '4183000000', address: '양평군', category: 'dvsn' },
    { bjd_code: '4167000000', address: '여주시', category: 'dvsn' },
    { bjd_code: '4180000000', address: '연천군', category: 'dvsn' },
    { bjd_code: '4137000000', address: '오산시', category: 'dvsn' },
    { bjd_code: '4146100000', address: '용인시 처인구', category: 'dvsn' },
    { bjd_code: '4146300000', address: '용인시 기흥구', category: 'dvsn' },
    { bjd_code: '4146500000', address: '용인시 수지구', category: 'dvsn' },
    { bjd_code: '4143000000', address: '의왕시', category: 'dvsn' },
    { bjd_code: '4115000000', address: '의정부시', category: 'dvsn' },
    { bjd_code: '4150000000', address: '이천시', category: 'dvsn' },
    { bjd_code: '4148000000', address: '파주시', category: 'dvsn' },
    { bjd_code: '4122000000', address: '평택시', category: 'dvsn' },
    { bjd_code: '4165000000', address: '포천시', category: 'dvsn' },
    { bjd_code: '4145000000', address: '하남시', category: 'dvsn' },
    { bjd_code: '4159000000', address: '화성시', category: 'dvsn' },
  ],
  // 부산시 (26)
  '26': [
    { bjd_code: '2644000000', address: '강서구', category: 'dvsn' },
    { bjd_code: '2641000000', address: '금정구', category: 'dvsn' },
    { bjd_code: '2671000000', address: '기장군', category: 'dvsn' },
    { bjd_code: '2629000000', address: '남구', category: 'dvsn' },
    { bjd_code: '2617000000', address: '동구', category: 'dvsn' },
    { bjd_code: '2626000000', address: '동래구', category: 'dvsn' },
    { bjd_code: '2623000000', address: '부산진구', category: 'dvsn' },
    { bjd_code: '2632000000', address: '북구', category: 'dvsn' },
    { bjd_code: '2653000000', address: '사상구', category: 'dvsn' },
    { bjd_code: '2638000000', address: '사하구', category: 'dvsn' },
    { bjd_code: '2614000000', address: '서구', category: 'dvsn' },
    { bjd_code: '2650000000', address: '수영구', category: 'dvsn' },
    { bjd_code: '2647000000', address: '연제구', category: 'dvsn' },
    { bjd_code: '2620000000', address: '영도구', category: 'dvsn' },
    { bjd_code: '2611000000', address: '중구', category: 'dvsn' },
    { bjd_code: '2635000000', address: '해운대구', category: 'dvsn' }
  ],
  // 인천시 (28)
  '28': [
    { bjd_code: '2871000000', address: '강화군', category: 'dvsn' },
    { bjd_code: '2824500000', address: '계양구', category: 'dvsn' },
    { bjd_code: '2820000000', address: '남동구', category: 'dvsn' },
    { bjd_code: '2814000000', address: '동구', category: 'dvsn' },
    { bjd_code: '2817700000', address: '미추홀구', category: 'dvsn' },
    { bjd_code: '2823700000', address: '부평구', category: 'dvsn' },
    { bjd_code: '2826000000', address: '서구', category: 'dvsn' },
    { bjd_code: '2818500000', address: '연수구', category: 'dvsn' },
    { bjd_code: '2872000000', address: '옹진군', category: 'dvsn' },
    { bjd_code: '2811000000', address: '중구', category: 'dvsn' }
  ],
  // 대전시 (30)
  '30': [
    { bjd_code: '3023000000', address: '대덕구', category: 'dvsn' },
    { bjd_code: '3011000000', address: '동구', category: 'dvsn' },
    { bjd_code: '3017000000', address: '서구', category: 'dvsn' },
    { bjd_code: '3020000000', address: '유성구', category: 'dvsn' },
    { bjd_code: '3014000000', address: '중구', category: 'dvsn' }
  ],
  // 대구시 (27)
  '27': [
    { bjd_code: '2720000000', address: '남구', category: 'dvsn' },
    { bjd_code: '2729000000', address: '달서구', category: 'dvsn' },
    { bjd_code: '2771000000', address: '달성군', category: 'dvsn' },
    { bjd_code: '2714000000', address: '동구', category: 'dvsn' },
    { bjd_code: '2723000000', address: '북구', category: 'dvsn' },
    { bjd_code: '2717000000', address: '서구', category: 'dvsn' },
    { bjd_code: '2726000000', address: '수성구', category: 'dvsn' },
    { bjd_code: '2711000000', address: '중구', category: 'dvsn' },
    { bjd_code: '2772000000', address: '군위군', category: 'dvsn' }
  ],
  // 울산시 (31)
  '31': [
    { bjd_code: '3114000000', address: '남구', category: 'dvsn' },
    { bjd_code: '3117000000', address: '동구', category: 'dvsn' },
    { bjd_code: '3120000000', address: '북구', category: 'dvsn' },
    { bjd_code: '3171000000', address: '울주군', category: 'dvsn' },
    { bjd_code: '3111000000', address: '중구', category: 'dvsn' }
  ],
  // 세종시 (36)
  '36': [
    { bjd_code: '3611000000', address: '세종시', category: 'dvsn' }
  ],
  // 광주시 (29)
  '29': [
    { bjd_code: '2920000000', address: '광산구', category: 'dvsn' },
    { bjd_code: '2915500000', address: '남구', category: 'dvsn' },
    { bjd_code: '2911000000', address: '동구', category: 'dvsn' },
    { bjd_code: '2917000000', address: '북구', category: 'dvsn' },
    { bjd_code: '2914000000', address: '서구', category: 'dvsn' }
  ],
  // 강원도 (51)
  '51': [
    { bjd_code: '5115000000', address: '강릉시', category: 'dvsn' },
    { bjd_code: '5182000000', address: '고성군', category: 'dvsn' },
    { bjd_code: '5117000000', address: '동해시', category: 'dvsn' },
    { bjd_code: '5123000000', address: '삼척시', category: 'dvsn' },
    { bjd_code: '5121000000', address: '속초시', category: 'dvsn' },
    { bjd_code: '5180000000', address: '양구군', category: 'dvsn' },
    { bjd_code: '5183000000', address: '양양군', category: 'dvsn' },
    { bjd_code: '5175000000', address: '영월군', category: 'dvsn' },
    { bjd_code: '5113000000', address: '원주시', category: 'dvsn' },
    { bjd_code: '5181000000', address: '인제군', category: 'dvsn' },
    { bjd_code: '5177000000', address: '정선군', category: 'dvsn' },
    { bjd_code: '5178000000', address: '철원군', category: 'dvsn' },
    { bjd_code: '5111000000', address: '춘천시', category: 'dvsn' },
    { bjd_code: '5119000000', address: '태백시', category: 'dvsn' },
    { bjd_code: '5176000000', address: '평창군', category: 'dvsn' },
    { bjd_code: '5172000000', address: '홍천군', category: 'dvsn' },
    { bjd_code: '5179000000', address: '화천군', category: 'dvsn' },
    { bjd_code: '5173000000', address: '횡성군', category: 'dvsn' }
  ],
  // 충청북도 (43)
  '43': [
    { bjd_code: '4376000000', address: '괴산군', category: 'dvsn' },
    { bjd_code: '4380000000', address: '단양군', category: 'dvsn' },
    { bjd_code: '4372000000', address: '보은군', category: 'dvsn' },
    { bjd_code: '4374000000', address: '영동군', category: 'dvsn' },
    { bjd_code: '4373000000', address: '옥천군', category: 'dvsn' },
    { bjd_code: '4377000000', address: '음성군', category: 'dvsn' },
    { bjd_code: '4315000000', address: '제천시', category: 'dvsn' },
    { bjd_code: '4374500000', address: '증평군', category: 'dvsn' },
    { bjd_code: '4375000000', address: '진천군', category: 'dvsn' },
    { bjd_code: '4311100000', address: '청주시 상당구', category: 'dvsn' },
    { bjd_code: '4311200000', address: '청주시 서원구', category: 'dvsn' },
    { bjd_code: '4311400000', address: '청주시 청원구', category: 'dvsn' },
    { bjd_code: '4311300000', address: '청주시 흥덕구', category: 'dvsn' },
    { bjd_code: '4313000000', address: '충주시', category: 'dvsn' }
  ],
  // 충청남도 (44)
  '44': [
    { bjd_code: '4425000000', address: '계룡시', category: 'dvsn' },
    { bjd_code: '4415000000', address: '공주시', category: 'dvsn' },
    { bjd_code: '4471000000', address: '금산군', category: 'dvsn' },
    { bjd_code: '4423000000', address: '논산시', category: 'dvsn' },
    { bjd_code: '4427000000', address: '당진시', category: 'dvsn' },
    { bjd_code: '4418000000', address: '보령시', category: 'dvsn' },
    { bjd_code: '4476000000', address: '부여군', category: 'dvsn' },
    { bjd_code: '4421000000', address: '서산시', category: 'dvsn' },
    { bjd_code: '4477000000', address: '서천군', category: 'dvsn' },
    { bjd_code: '4420000000', address: '아산시', category: 'dvsn' },
    { bjd_code: '4481000000', address: '예산군', category: 'dvsn' },
    { bjd_code: '4413100000', address: '천안시 동남구', category: 'dvsn' },
    { bjd_code: '4413300000', address: '천안시 서북구', category: 'dvsn' },
    { bjd_code: '4479000000', address: '청양군', category: 'dvsn' },
    { bjd_code: '4482500000', address: '태안군', category: 'dvsn' },
    { bjd_code: '4480000000', address: '홍성군', category: 'dvsn' }
  ],
  // 경상북도 (47)
  '47': [
    { bjd_code: '4729000000', address: '경산시', category: 'dvsn' },
    { bjd_code: '4713000000', address: '경주시', category: 'dvsn' },
    { bjd_code: '4783000000', address: '고령군', category: 'dvsn' },
    { bjd_code: '4719000000', address: '구미시', category: 'dvsn' },
    { bjd_code: '4715000000', address: '김천시', category: 'dvsn' },
    { bjd_code: '4728000000', address: '문경시', category: 'dvsn' },
    { bjd_code: '4792000000', address: '봉화군', category: 'dvsn' },
    { bjd_code: '4725000000', address: '상주시', category: 'dvsn' },
    { bjd_code: '4784000000', address: '성주군', category: 'dvsn' },
    { bjd_code: '4717000000', address: '안동시', category: 'dvsn' },
    { bjd_code: '4777000000', address: '영덕군', category: 'dvsn' },
    { bjd_code: '4776000000', address: '영양군', category: 'dvsn' },
    { bjd_code: '4721000000', address: '영주시', category: 'dvsn' },
    { bjd_code: '4723000000', address: '영천시', category: 'dvsn' },
    { bjd_code: '4790000000', address: '예천군', category: 'dvsn' },
    { bjd_code: '4794000000', address: '울릉군', category: 'dvsn' },
    { bjd_code: '4793000000', address: '울진군', category: 'dvsn' },
    { bjd_code: '4773000000', address: '의성군', category: 'dvsn' },
    { bjd_code: '4782000000', address: '청도군', category: 'dvsn' },
    { bjd_code: '4775000000', address: '청송군', category: 'dvsn' },
    { bjd_code: '4785000000', address: '칠곡군', category: 'dvsn' },
    { bjd_code: '4711100000', address: '포항시 남구', category: 'dvsn' },
    { bjd_code: '4711300000', address: '포항시 북구', category: 'dvsn' }
  ],
  // 경상남도 (48)
  '48': [
    { bjd_code: '4831000000', address: '거제시', category: 'dvsn' },
    { bjd_code: '4888000000', address: '거창군', category: 'dvsn' },
    { bjd_code: '4882000000', address: '고성군', category: 'dvsn' },
    { bjd_code: '4825000000', address: '김해시', category: 'dvsn' },
    { bjd_code: '4884000000', address: '남해군', category: 'dvsn' },
    { bjd_code: '4827000000', address: '밀양시', category: 'dvsn' },
    { bjd_code: '4824000000', address: '사천시', category: 'dvsn' },
    { bjd_code: '4886000000', address: '산청군', category: 'dvsn' },
    { bjd_code: '4833000000', address: '양산시', category: 'dvsn' },
    { bjd_code: '4872000000', address: '의령군', category: 'dvsn' },
    { bjd_code: '4817000000', address: '진주시', category: 'dvsn' },
    { bjd_code: '4874000000', address: '창녕군', category: 'dvsn' },
    { bjd_code: '4812500000', address: '창원시 마산합포구', category: 'dvsn' },
    { bjd_code: '4812700000', address: '창원시 마산회원구', category: 'dvsn' },
    { bjd_code: '4812300000', address: '창원시 성산구', category: 'dvsn' },
    { bjd_code: '4812100000', address: '창원시 의창구', category: 'dvsn' },
    { bjd_code: '4812900000', address: '창원시 진해구', category: 'dvsn' },
    { bjd_code: '4822000000', address: '통영시', category: 'dvsn' },
    { bjd_code: '4885000000', address: '하동군', category: 'dvsn' },
    { bjd_code: '4873000000', address: '함안군', category: 'dvsn' },
    { bjd_code: '4887000000', address: '함양군', category: 'dvsn' },
    { bjd_code: '4889000000', address: '합천군', category: 'dvsn' }
  ],
  // 전북도 (52)
  '52': [
    { bjd_code: '5279000000', address: '고창군', category: 'dvsn' },
    { bjd_code: '5213000000', address: '군산시', category: 'dvsn' },
    { bjd_code: '5221000000', address: '김제시', category: 'dvsn' },
    { bjd_code: '5219000000', address: '남원시', category: 'dvsn' },
    { bjd_code: '5273000000', address: '무주군', category: 'dvsn' },
    { bjd_code: '5280000000', address: '부안군', category: 'dvsn' },
    { bjd_code: '5277000000', address: '순창군', category: 'dvsn' },
    { bjd_code: '5271000000', address: '완주군', category: 'dvsn' },
    { bjd_code: '5214000000', address: '익산시', category: 'dvsn' },
    { bjd_code: '5275000000', address: '임실군', category: 'dvsn' },
    { bjd_code: '5274000000', address: '장수군', category: 'dvsn' },
    { bjd_code: '5211300000', address: '전주시 덕진구', category: 'dvsn' },
    { bjd_code: '5211100000', address: '전주시 완산구', category: 'dvsn' },
    { bjd_code: '5218000000', address: '정읍시', category: 'dvsn' },
    { bjd_code: '5272000000', address: '진안군', category: 'dvsn' }
  ],
  // 전라남도 (46)
  '46': [
    { bjd_code: '4681000000', address: '강진군', category: 'dvsn' },
    { bjd_code: '4677000000', address: '고흥군', category: 'dvsn' },
    { bjd_code: '4672000000', address: '곡성군', category: 'dvsn' },
    { bjd_code: '4623000000', address: '광양시', category: 'dvsn' },
    { bjd_code: '4673000000', address: '구례군', category: 'dvsn' },
    { bjd_code: '4617000000', address: '나주시', category: 'dvsn' },
    { bjd_code: '4671000000', address: '담양군', category: 'dvsn' },
    { bjd_code: '4611000000', address: '목포시', category: 'dvsn' },
    { bjd_code: '4684000000', address: '무안군', category: 'dvsn' },
    { bjd_code: '4678000000', address: '보성군', category: 'dvsn' },
    { bjd_code: '4615000000', address: '순천시', category: 'dvsn' },
    { bjd_code: '4691000000', address: '신안군', category: 'dvsn' },
    { bjd_code: '4613000000', address: '여수시', category: 'dvsn' },
    { bjd_code: '4687000000', address: '영광군', category: 'dvsn' },
    { bjd_code: '4683000000', address: '영암군', category: 'dvsn' },
    { bjd_code: '4689000000', address: '완도군', category: 'dvsn' },
    { bjd_code: '4688000000', address: '장성군', category: 'dvsn' },
    { bjd_code: '4680000000', address: '장흥군', category: 'dvsn' },
    { bjd_code: '4690000000', address: '진도군', category: 'dvsn' },
    { bjd_code: '4686000000', address: '함평군', category: 'dvsn' },
    { bjd_code: '4682000000', address: '해남군', category: 'dvsn' },
    { bjd_code: '4679000000', address: '화순군', category: 'dvsn' }
  ],
  // 제주도 (50)
  '50': [
    { bjd_code: '5013000000', address: '서귀포시', category: 'dvsn' },
    { bjd_code: '5011000000', address: '제주시', category: 'dvsn' }
  ]
};

interface RegionFilterProps {
  onRegionChange: (selectedRegionCode: string | null, selectedRegionName?: string | null) => void;
  onCenterChange?: (coordinates: { latitude: number, longitude: number, zoomLevel: number }) => void;
}

const RegionFilter: React.FC<RegionFilterProps> = ({ onRegionChange, onCenterChange }) => {
  const [activeStep, setActiveStep] = useState<"city" | "district" | "dong">("city");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedDong, setSelectedDong] = useState<string>("");
  const [dongOptions, setDongOptions] = useState<RegionItem[]>([]);
  const [isLoadingDongs, setIsLoadingDongs] = useState<boolean>(false);
  
  const [selectedCityName, setSelectedCityName] = useState<string>("");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("");
  const [selectedDongName, setSelectedDongName] = useState<string>("");

  // 현재 선택된 시/도에 해당하는 구/군 목록 계산
  const getDistrictOptions = useCallback(() => {
    if (!selectedCity) return [];
    const cityPrefix = selectedCity.substr(0, 2);
    return DISTRICTS_IN_CITIES[cityPrefix] || [];
  }, [selectedCity]);

  // 지역 선택 초기화
  const handleReset = () => {
    setSelectedCity("");
    setSelectedDistrict("");
    setSelectedDong("");
    setSelectedCityName("");
    setSelectedDistrictName("");
    setSelectedDongName("");
    setDongOptions([]);
    setActiveStep("city");
    onRegionChange(null, null);
  };

  // 선택된 시/도 변경 핸들러
  const handleCityChange = useCallback((cityCode: string, cityName: string) => {
    setSelectedCity(cityCode);
    setSelectedCityName(cityName);
    setSelectedDistrict("");
    setSelectedDistrictName("");
    setSelectedDong("");
    setSelectedDongName("");
    setDongOptions([]);
    setActiveStep("district");

    const selectedCityItem = CITIES.find(city => city.bjd_code === cityCode);
    if (selectedCityItem && selectedCityItem.latitude && selectedCityItem.longitude && selectedCityItem.zoomLevel && onCenterChange) {
      onCenterChange({
        latitude: selectedCityItem.latitude,
        longitude: selectedCityItem.longitude,
        zoomLevel: selectedCityItem.zoomLevel
      });
    }
  }, [onCenterChange]);

  // 선택된 구/군 변경 핸들러
  const handleDistrictChange = useCallback(async (districtCode: string, districtName: string) => {
    setSelectedDistrict(districtCode);
    setSelectedDistrictName(districtName);
    setSelectedDong("");
    setSelectedDongName("");
    setIsLoadingDongs(true);
    setDongOptions([]); // 이전 동 옵션 초기화
    setActiveStep("dong");

    try {
      const regions = await fetchRegionsAPI(districtCode);
      console.log('API 응답:', regions); // 디버깅용 로그
      
      if (regions.length === 0) {
        // API에서 데이터를 반환했지만 빈 배열인 경우
        setDongOptions([]);
        return;
      }
      
      const regionItems: RegionItem[] = regions.map(region => ({
        bjd_code: region.cortarNo,
        address: region.cortarName,
        category: region.cortarType,
        latitude: region.centerLat,  // API 응답의 centerLat 사용
        longitude: region.centerLon, // API 응답의 centerLon 사용
        zoomLevel: 7 // 동 레벨에서 사용할 적절한 줌 레벨
      }));
      
      setDongOptions(regionItems);
      
      // 구/군 좌표가 있는 경우 지도 중심 이동
      const districtObj = getDistrictOptions().find(d => d.bjd_code === districtCode);
      if (districtObj && districtObj.latitude && districtObj.longitude && districtObj.zoomLevel && onCenterChange) {
        onCenterChange({
          latitude: districtObj.latitude,
          longitude: districtObj.longitude,
          zoomLevel: districtObj.zoomLevel
        });
      }
    } catch (error) {
      console.error('동 정보를 불러올 수 없습니다.', error);
      setDongOptions([]);
    } finally {
      setIsLoadingDongs(false);
    }
  }, [onCenterChange, getDistrictOptions]);

  // 선택된 동 변경 핸들러
  const handleDongChange = useCallback((dongCode: string, dongName: string) => {
    setSelectedDong(dongCode);
    setSelectedDongName(dongName);
    onRegionChange(dongCode, dongName);
    
    // 동에 좌표가 있으면 지도 중심 이동
    const dongObj = dongOptions.find(d => d.bjd_code === dongCode);
    if (dongObj && dongObj.latitude && dongObj.longitude && onCenterChange) {
      onCenterChange({
        latitude: dongObj.latitude,
        longitude: dongObj.longitude,
        zoomLevel: 5 // 동 레벨에서는 고정된 줌 레벨 사용
      });
    }
  }, [onRegionChange, dongOptions, onCenterChange]);

  // 그리드 레이아웃으로 지역 버튼 렌더링
  const renderRegionButtons = (regions: RegionItem[], handleSelect: (code: string, name: string) => void, selectedValue: string) => {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {regions.map((region) => (
          <Button
            key={region.bjd_code}
            variant={selectedValue === region.bjd_code ? "contained" : "outlined"}
            color={selectedValue === region.bjd_code ? "primary" : "inherit"}
            onClick={() => handleSelect(region.bjd_code, region.address)}
            sx={{ 
              width: 'calc(25% - 8px)', // 4개씩 배치, gap 고려
              textAlign: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              textTransform: 'none',
              height: '38px',
              lineHeight: '1.2',
              fontSize: '0.875rem',
              margin: '0 0 8px 0',
              padding: '0 4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              borderColor: selectedValue === region.bjd_code ? '#007AFF' : '#ddd',
              color: selectedValue === region.bjd_code ? 'white' : '#333',
              backgroundColor: selectedValue === region.bjd_code ? '#007AFF' : 'transparent',
              '&:hover': {
                backgroundColor: selectedValue === region.bjd_code ? '#0069d9' : 'rgba(0, 0, 0, 0.04)',
                borderColor: selectedValue === region.bjd_code ? '#0062cc' : '#ccc'
              },
              '@media (max-width: 600px)': {
                width: 'calc(33.333% - 8px)', // 모바일에서는 3개씩
              }
            }}
          >
            {region.address}
          </Button>
        ))}
      </Box>
    );
  };

  // 선택된 지역 경로 표시
  const renderLocationPath = () => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LocationOnIcon sx={{ color: '#767676', fontSize: '1.25rem', mr: 0.5 }} />
        
        <Typography 
          variant="body1"
          component="span" 
          sx={{ 
            color: selectedCityName ? '#333' : '#767676', 
            fontWeight: selectedCityName ? 500 : 400,
            cursor: selectedCityName ? 'pointer' : 'default',
            '&:hover': {
              textDecoration: selectedCityName ? 'underline' : 'none',
              color: selectedCityName ? '#007AFF' : '#767676'
            }
          }}
          onClick={selectedCityName ? () => setActiveStep("city") : undefined}
        >
          {selectedCityName || '시/도'}
        </Typography>
        
        {selectedCityName && (
          <>
            <Typography variant="body1" component="span" sx={{ mx: 1, color: '#767676' }}>{'>'}</Typography>
            <Typography 
              variant="body1" 
              component="span" 
              sx={{ 
                color: selectedDistrictName ? '#333' : '#767676', 
                fontWeight: selectedDistrictName ? 500 : 400,
                cursor: selectedDistrictName ? 'pointer' : 'default',
                '&:hover': {
                  textDecoration: selectedDistrictName ? 'underline' : 'none',
                  color: selectedDistrictName ? '#007AFF' : '#767676'
                }
              }}
              onClick={selectedDistrictName ? () => setActiveStep("district") : undefined}
            >
              {selectedDistrictName || '구/군'}
            </Typography>
          </>
        )}
        
        {selectedDistrictName && (
          <>
            <Typography variant="body1" component="span" sx={{ mx: 1, color: '#767676' }}>{'>'}</Typography>
            <Typography 
              variant="body1" 
              component="span" 
              sx={{ 
                color: selectedDongName ? '#333' : '#767676', 
                fontWeight: selectedDongName ? 500 : 400
              }}
            >
              {selectedDongName || '읍/면/동'}
            </Typography>
          </>
        )}
      </Box>
    );
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        borderRadius: 1, 
        backgroundColor: 'white',
        border: '1px solid #eee',
        mb: 2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography 
          variant="h6" 
          component="h2" 
          sx={{ 
            fontSize: '1rem', 
            fontWeight: 500,
            color: '#333' 
          }}
        >
          지역 선택
        </Typography>
        
        {(selectedCity || selectedDistrict || selectedDong) && (
          <Button 
            startIcon={<RefreshIcon sx={{ fontSize: '18px' }} />}
            size="small"
            onClick={handleReset}
            sx={{ 
              color: '#007AFF', 
              fontSize: '0.8125rem',
              textTransform: 'none',
              minWidth: 'unset',
              p: '4px 8px'
            }}
          >
            초기화
          </Button>
        )}
      </Box>
      
      {renderLocationPath()}
      
      <Divider sx={{ mb: 2, backgroundColor: '#eee' }} />
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: '#767676', mb: 1 }}>
          {activeStep === "city" ? "시/도" : activeStep === "district" ? "시/군/구" : "읍/면/동"}
        </Typography>
      </Box>
      
      {activeStep === "city" && (
        <Box>
          {renderRegionButtons(CITIES, handleCityChange, selectedCity)}
        </Box>
      )}
      
      {activeStep === "district" && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Button 
              size="small" 
              onClick={() => setActiveStep("city")}
              startIcon={<ArrowBackIcon sx={{ fontSize: '16px' }} />}
              sx={{ 
                mr: 1,
                color: '#007AFF',
                textTransform: 'none',
                fontSize: '0.8125rem',
                minWidth: 'unset',
                p: '4px 8px'
              }}
            >
              시/도
            </Button>
            <Typography 
              variant="subtitle1"
              sx={{ 
                fontSize: '0.9375rem', 
                fontWeight: 500,
                color: '#333'
              }}
            >
              {selectedCityName} 내 지역
            </Typography>
          </Box>
          {getDistrictOptions().length > 0 ? (
            renderRegionButtons(getDistrictOptions(), handleDistrictChange, selectedDistrict)
          ) : (
            <Typography variant="body2" sx={{ color: '#767676', textAlign: 'center', py: 2 }}>
              시/군/구 정보를 불러올 수 없습니다.
            </Typography>
          )}
        </Box>
      )}
      
      {activeStep === "dong" && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Button 
              size="small" 
              onClick={() => setActiveStep("district")}
              startIcon={<ArrowBackIcon sx={{ fontSize: '16px' }} />}
              sx={{ 
                mr: 1,
                color: '#007AFF',
                textTransform: 'none',
                fontSize: '0.8125rem',
                minWidth: 'unset',
                p: '4px 8px'
              }}
            >
              구/군
            </Button>
            <Typography 
              variant="subtitle1"
              sx={{ 
                fontSize: '0.9375rem', 
                fontWeight: 500,
                color: '#333'
              }}
            >
              {selectedDistrictName} 내 동
            </Typography>
          </Box>
          
          {isLoadingDongs ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={30} sx={{ color: '#007AFF' }} />
            </Box>
          ) : dongOptions.length > 0 ? (
            renderRegionButtons(dongOptions, handleDongChange, selectedDong)
          ) : (
            <Typography 
              variant="body2" 
              sx={{ 
                textAlign: 'center', 
                py: 2, 
                color: '#767676',
                fontSize: '0.875rem'
              }}
            >
              현재 읍/면/동 정보를 사용할 수 없습니다.
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default RegionFilter; 