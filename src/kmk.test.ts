import {describe, expect, test} from '@jest/globals';
import * as kmk from './kmk';
import { TeamMemberStats } from './types';

describe('kmk', () => {

  test('topCyclist with empty stats', () => {
    const curr: TeamMemberStats = {distanceStatistics: [], timeStatistics: []};
    const prev: TeamMemberStats = null;
    expect(kmk.getTopCyclist(curr, prev)).toBe(null);
  });

  test('topCyclist with empty stats', () => {
    const curr: TeamMemberStats = {distanceStatistics: [], timeStatistics: []};
    const prev: TeamMemberStats = null;
    expect(kmk.getTopCyclist(curr, prev)).toBe(null);
  });

  test('topCyclist with empty prev stats', () => {
    const curr: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 10, distanceByEbike: 0, totalCyclingDays: 1, totalDistance: 10, placement: 1, name: "biker1" },
        {distanceByRegularBike: 5, distanceByEbike: 1, totalCyclingDays: 2, totalDistance: 6, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    const prev: TeamMemberStats = {
      distanceStatistics: [],
      timeStatistics: [],
    };
    expect(kmk.getTopCyclist(curr, prev)).toMatchObject({
      name: 'biker1',
      //score: 25,
      totalDistance: 10,
      distanceByRegularBike: 10,
      distanceByEbike: 0,
    });
  });

  test('topCyclist with stats', () => {
    const curr: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 10.5, distanceByEbike: 0, totalCyclingDays: 2, totalDistance: 10, placement: 1, name: "biker1" },
        {distanceByRegularBike: 5, distanceByEbike: 1.2, totalCyclingDays: 2, totalDistance: 6, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    const prev: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 9, distanceByEbike: 0, totalCyclingDays: 1, totalDistance: 9, placement: 1, name: "biker1" },
        {distanceByRegularBike: 0, distanceByEbike: 0, totalCyclingDays: 2, totalDistance: 6, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    expect(kmk.getTopCyclist(curr, prev)).toMatchObject({
      name: 'biker2',
      totalDistance: 6.2,
      distanceByRegularBike: 5,
      distanceByEbike: 1.2,
    });
  });

  test('topCyclist regular wins ebike', () => {
    const curr: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 0, distanceByEbike: 12, totalCyclingDays: 2, totalDistance: 12, placement: 1, name: "biker1" },
        {distanceByRegularBike: 11, distanceByEbike: 0, totalCyclingDays: 2, totalDistance: 11, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    const prev: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 0, distanceByEbike: 2, totalCyclingDays: 1, totalDistance: 2, placement: 1, name: "biker1" },
        {distanceByRegularBike: 1, distanceByEbike: 0, totalCyclingDays: 1, totalDistance: 1, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    expect(kmk.getTopCyclist(curr, prev)).toMatchObject({
      name: 'biker2',
      totalDistance: 10,
      distanceByRegularBike: 10,
      distanceByEbike: 0,
    });
  });

  test('relative increase wins absolute', () => {
    const curr: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 200, distanceByEbike: 0, totalCyclingDays: 2, totalDistance: 200, placement: 1, name: "biker1" },
        {distanceByRegularBike: 100, distanceByEbike: 0, totalCyclingDays: 2, totalDistance: 100, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    const prev: TeamMemberStats = {
      distanceStatistics: [
        {distanceByRegularBike: 100, distanceByEbike: 0, totalCyclingDays: 1, totalDistance: 100, placement: 1, name: "biker1" },
        {distanceByRegularBike: 40, distanceByEbike: 0, totalCyclingDays: 1, totalDistance: 40, placement: 2, name: "biker2" },
      ],
      timeStatistics: [],
    };
    expect(kmk.getTopCyclist(curr, prev)).toMatchObject({
      name: 'biker2',
      totalDistance: 60,
      distanceByRegularBike: 60,
      distanceByEbike: 0,
    });
  });
});