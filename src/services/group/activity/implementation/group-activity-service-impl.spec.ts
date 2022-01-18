import {CsGroupActivityAggregationMetric, CsGroupActivityService} from '../interface';
import {CsHttpService, CsResponse} from '../../../../core/http-service/interface';
import {Container} from 'inversify';
import {InjectionTokens} from '../../../../injection-tokens';
import {GroupActivityServiceImpl} from './group-activity-service-impl';
import {of, throwError} from 'rxjs';
import {Group} from '../../../../models/group';
import {CsHttpClientError} from '../../../../core/http-service/errors';

describe('GroupActivityServiceImpl', () => {
    let activityService: CsGroupActivityService;
    const mockHttpService: Partial<CsHttpService> = {};
    const mockDataApiPath = 'MOCK_DATA_API_PATH';

    beforeAll(() => {
        const container = new Container();

        container.bind<CsHttpService>(InjectionTokens.core.HTTP_SERVICE).toConstantValue(mockHttpService as CsHttpService);
        container.bind<string>(InjectionTokens.services.group.GROUP_SERVICE_DATA_API_PATH).toConstantValue(mockDataApiPath);

        container.bind<CsGroupActivityService>(InjectionTokens.services.group.GROUP_ACTIVITY_SERVICE).to(GroupActivityServiceImpl).inSingletonScope();

        activityService = container.get<CsGroupActivityService>(InjectionTokens.services.group.GROUP_ACTIVITY_SERVICE);
    });

    beforeEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it('should be able to get an instance from the container', () => {
        expect(activityService).toBeTruthy();
    });

    describe('getDataAggregation()', () => {
        it('should be able to get data aggregation of a group activity', (done) => {
            mockHttpService.fetch = jest.fn(() => {
                const response = new CsResponse();
                response.responseCode = 200;
                response.body = {
                    result: {
                        'activity': {
                            'agg': [
                                {
                                    'metric': 'enrolmentCount',
                                    'lastUpdatedOn': '1594734425894',
                                    'value': 1
                                }
                            ],
                            'id': 'do_11305913172235878411827',
                            'type': 'course'
                        },
                        'groupId': 'f5fd09d5-7697-4c54-bb25-28758c9a2a45',
                        'members': [
                            {
                                'agg': [
                                    {
                                        'metric': 'completedCount',
                                        'lastUpdatedOn': 1594734198,
                                        'value': 1
                                    }
                                ],
                                'role': 'admin',
                                'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                'name': 'checkdevuser103 checkdevuser103',
                                'userId': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                'status': 'active'
                            }
                        ]
                    }
                };
                return of(response);
            });

            const activity = {
                id: 'SOME_ACTIVITY_ID',
                type: 'SOME_ACTIVITY_TYPE'
            };

            activityService.getDataAggregation('SOME_GROUP_ID', activity).subscribe(() => {
                expect(mockHttpService.fetch).toHaveBeenCalledWith(expect.objectContaining({
                    type: 'POST',
                    body: {
                        request: {
                            groupId: 'SOME_GROUP_ID',
                            activityId: 'SOME_ACTIVITY_ID',
                            activityType: 'SOME_ACTIVITY_TYPE'
                        }
                    }
                }));
                done();
            });
        });

        it('should merge missing members into response when mergeGroup provided', (done) => {
            mockHttpService.fetch = jest.fn(() => {
                const response = new CsResponse();
                response.responseCode = 200;
                response.body = {
                    result: {
                        'activity': {
                            'agg': [
                                {
                                    'metric': 'enrolmentCount',
                                    'lastUpdatedOn': '1594734425894',
                                    'value': 1
                                }
                            ],
                            'id': 'do_11305913172235878411827',
                            'type': 'course'
                        },
                        'groupId': 'f5fd09d5-7697-4c54-bb25-28758c9a2a45',
                        'members': [
                            {
                                'agg': [
                                    {
                                        'metric': 'completedCount',
                                        'lastUpdatedOn': 1594734198,
                                        'value': 10
                                    }
                                ],
                                'role': 'admin',
                                'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                'name': 'member2',
                                'userId': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                'status': 'active'
                            }
                        ]
                    }
                };
                return of(response);
            });

            const activity = {
                id: 'SOME_ACTIVITY_ID',
                type: 'SOME_ACTIVITY_TYPE'
            };

            const mergeGroup = {
                'activities': [],
                'members': [
                    {
                        'userId': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                        'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                        'role': 'admin',
                        'status': 'active',
                        'createdOn': '2020-07-15 11:44:07:291+0000',
                        'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                        'name': 'member1'
                    },
                    {
                        'userId': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                        'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                        'role': 'admin',
                        'status': 'active',
                        'createdOn': '2020-07-15 11:44:07:291+0000',
                        'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                        'name': 'member2'
                    },
                    {
                        'userId': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                        'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                        'role': 'admin',
                        'status': 'active',
                        'createdOn': '2020-07-15 11:44:07:291+0000',
                        'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                        'name': 'member3'
                    }
                ]
            } as Partial<Group>;

            activityService.getDataAggregation('SOME_GROUP_ID', activity, mergeGroup as Group).subscribe((response) => {
                expect(response.members).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        agg: expect.arrayContaining([
                            expect.objectContaining({
                                metric: CsGroupActivityAggregationMetric.COMPLETED_COUNT,
                                value: 0
                            })
                        ]),
                        name: 'member1'
                    }),
                    expect.objectContaining({
                        agg: expect.arrayContaining([
                            expect.objectContaining({
                                metric: CsGroupActivityAggregationMetric.COMPLETED_COUNT,
                                value: 10
                            })
                        ]),
                        name: 'member2'
                    }),
                    expect.objectContaining({
                        agg: expect.arrayContaining([
                            expect.objectContaining({
                                metric: CsGroupActivityAggregationMetric.COMPLETED_COUNT,
                                value: 0
                            })
                        ]),
                        name: 'member3'
                    }),
                ]));
                done();
            });
        });

        it('should exclude duplicate metrics, taking higher value with precedence', (done) => {
            mockHttpService.fetch = jest.fn(() => {
                const response = new CsResponse();
                response.responseCode = 200;
                response.body = {
                    result: {
                        'activity': {
                            'agg': [
                                {
                                    'metric': 'enrolmentCount',
                                    'lastUpdatedOn': '1594734425894',
                                    'value': 1
                                }
                            ],
                            'id': 'do_11305913172235878411827',
                            'type': 'course'
                        },
                        'groupId': 'f5fd09d5-7697-4c54-bb25-28758c9a2a45',
                        'members': [
                            {
                                'agg': [
                                    {
                                        'metric': 'completedCount',
                                        'lastUpdatedOn': 1594734198,
                                        'value': 10
                                    }
                                ],
                                'role': 'admin',
                                'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                'name': 'member2',
                                'userId': 'member2',
                                'status': 'active'
                            },
                            {
                                'agg': [
                                    {
                                        'metric': 'completedCount',
                                        'lastUpdatedOn': 1594734198,
                                        'value': 20
                                    }
                                ],
                                'role': 'admin',
                                'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                'name': 'member2',
                                'userId': 'member2',
                                'status': 'active'
                            },
                            {
                                'agg': [
                                    {
                                        'metric': 'completedCount',
                                        'lastUpdatedOn': 1594734198,
                                        'value': 0
                                    }
                                ],
                                'role': 'admin',
                                'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                'name': 'member3',
                                'userId': 'member3',
                                'status': 'active'
                            },
                            {
                                'agg': [
                                    {
                                        'metric': 'completedCount',
                                        'lastUpdatedOn': 1594734198,
                                        'value': 40
                                    }
                                ],
                                'role': 'admin',
                                'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                'name': 'member3',
                                'userId': 'member3',
                                'status': 'active'
                            }
                        ]
                    }
                };
                return of(response);
            });

            const activity = {
                id: 'SOME_ACTIVITY_ID',
                type: 'SOME_ACTIVITY_TYPE'
            };

            const mergeGroup = {
                'activities': [],
                'members': [
                    {
                        'userId': 'member3',
                        'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                        'role': 'admin',
                        'status': 'active',
                        'createdOn': '2020-07-15 11:44:07:291+0000',
                        'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                        'name': 'member3'
                    },
                    {
                        'userId': 'member1',
                        'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                        'role': 'admin',
                        'status': 'active',
                        'createdOn': '2020-07-15 11:44:07:291+0000',
                        'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                        'name': 'member1'
                    },
                    {
                        'userId': 'member2',
                        'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                        'role': 'admin',
                        'status': 'active',
                        'createdOn': '2020-07-15 11:44:07:291+0000',
                        'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                        'name': 'member2'
                    }
                ]
            } as Partial<Group>;

            activityService.getDataAggregation('SOME_GROUP_ID', activity, mergeGroup as Group).subscribe((response) => {
                expect(response.members.map((m) => m.name + '-' + m.agg[0].value)).toEqual(['member3-40', 'member1-0', 'member2-20']);
                done();
            });
        });

        describe('when leafNodeCount available', () => {
            it('should add progress metric when leafNodeCount available via mergeGroup only', (done) => {
                mockHttpService.fetch = jest.fn(() => {
                    const response = new CsResponse();
                    response.responseCode = 200;
                    response.body = {
                        result: {
                            'activity': {
                                'agg': [
                                    {
                                        'metric': 'enrolmentCount',
                                        'lastUpdatedOn': '1594734425894',
                                        'value': 1
                                    }
                                ],
                                'id': 'do_11305913172235878411827',
                                'type': 'course'
                            },
                            'groupId': 'f5fd09d5-7697-4c54-bb25-28758c9a2a45',
                            'members': [
                                {
                                    'agg': [
                                        {
                                            'metric': 'completedCount',
                                            'lastUpdatedOn': 1594734198,
                                            'value': 110
                                        }
                                    ],
                                    'role': 'admin',
                                    'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                    'name': 'member1',
                                    'userId': 'member1',
                                    'status': 'active'
                                },
                                {
                                    'agg': [
                                        {
                                            'metric': 'completedCount',
                                            'lastUpdatedOn': 1594734198,
                                            'value': 10
                                        }
                                    ],
                                    'role': 'admin',
                                    'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                    'name': 'member2',
                                    'userId': 'member2',
                                    'status': 'active'
                                },
                                {
                                    'agg': [
                                        {
                                            'metric': 'completedCount',
                                            'lastUpdatedOn': 1594734198,
                                            'value': 20
                                        }
                                    ],
                                    'role': 'admin',
                                    'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                    'name': 'member2',
                                    'userId': 'member2',
                                    'status': 'active'
                                },
                                {
                                    'agg': [
                                        {
                                            'metric': 'completedCount',
                                            'lastUpdatedOn': 1594734198,
                                            'value': 0
                                        }
                                    ],
                                    'role': 'admin',
                                    'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                    'name': 'member3',
                                    'userId': 'member3',
                                    'status': 'active'
                                },
                                {
                                    'agg': [
                                        {
                                            'metric': 'completedCount',
                                            'lastUpdatedOn': 1594734198,
                                            'value': 40
                                        }
                                    ],
                                    'role': 'admin',
                                    'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                    'name': 'member3',
                                    'userId': 'member3',
                                    'status': 'active'
                                }
                            ]
                        }
                    };
                    return of(response);
                });

                const activity = {
                    id: 'do_11305913172235878411827',
                    type: 'Course'
                };

                const mergeGroup = {
                    'activities': [
                        {
                            id: 'do_11305913172235878411827',
                            type: 'Course',
                            activityInfo: {
                                identifier: 'do_21301074192677273611434',
                                appIcon: 'https://ntpstagingall.blob.core.windows.net/ntp-content-staging/content/do_2127814568517795841477/artifact/100x100_1560236432219.jpg',
                                name: ' "Courses Batches" ',
                                organisation: ['Odisha'],
                                topic: ['Teaching and Classroom Management', 'Leadership Management', 'ICT'],
                                language: ['English'],
                                mimeType: 'application/vnd.ekstep.content-collection',
                                contentType: 'Course',
                                objectType: 'Content',
                                resourceType: 'Course',
                                leafNodesCount: 100
                            }
                        }
                    ],
                    'members': [
                        {
                            'userId': 'member3',
                            'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                            'role': 'admin',
                            'status': 'active',
                            'createdOn': '2020-07-15 11:44:07:291+0000',
                            'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                            'name': 'member3'
                        },
                        {
                            'userId': 'member1',
                            'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                            'role': 'admin',
                            'status': 'active',
                            'createdOn': '2020-07-15 11:44:07:291+0000',
                            'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                            'name': 'member1'
                        },
                        {
                            'userId': 'member2',
                            'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                            'role': 'admin',
                            'status': 'active',
                            'createdOn': '2020-07-15 11:44:07:291+0000',
                            'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                            'name': 'member2'
                        }
                    ]
                } as Partial<Group>;

                activityService.getDataAggregation('SOME_GROUP_ID', activity, mergeGroup as Group).subscribe((response) => {
                    expect(response.members).toEqual([
                        expect.objectContaining({
                            name: 'member3',
                            agg: expect.arrayContaining([
                                expect.objectContaining({
                                    metric: CsGroupActivityAggregationMetric.PROGRESS,
                                    lastUpdatedOn: expect.anything(),
                                    value: 40
                                }),
                            ]),
                        }),
                        expect.objectContaining({
                            name: 'member1',
                            agg: expect.arrayContaining([
                                expect.objectContaining({
                                    metric: CsGroupActivityAggregationMetric.PROGRESS,
                                    lastUpdatedOn: expect.anything(),
                                    value: 100
                                }),
                            ]),
                        }),
                        expect.objectContaining({
                            name: 'member2',
                            agg: expect.arrayContaining([
                                expect.objectContaining({
                                    metric: CsGroupActivityAggregationMetric.PROGRESS,
                                    lastUpdatedOn: expect.anything(),
                                    value: 20
                                }),
                            ]),
                        })
                    ]);
                    done();
                });
            });

            it('should add progress metric when leafNodeCount available via request', (done) => {
                mockHttpService.fetch = jest.fn(() => {
                    const response = new CsResponse();
                    response.responseCode = 200;
                    response.body = {
                        result: {
                            'activity': {
                                'agg': [
                                    {
                                        'metric': 'enrolmentCount',
                                        'lastUpdatedOn': '1594734425894',
                                        'value': 1
                                    }
                                ],
                                'id': 'do_11305913172235878411827',
                                'type': 'course'
                            },
                            'groupId': 'f5fd09d5-7697-4c54-bb25-28758c9a2a45',
                            'members': [
                                {
                                    'agg': [
                                        {
                                            'metric': 'completedCount',
                                            'lastUpdatedOn': 1594734198,
                                            'value': 110
                                        }
                                    ],
                                    'role': 'admin',
                                    'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                    'name': 'member1',
                                    'userId': 'member1',
                                    'status': 'active'
                                },
                                {
                                    'agg': [
                                        {
                                            'metric': 'completedCount',
                                            'lastUpdatedOn': 1594734198,
                                            'value': 10
                                        }
                                    ],
                                    'role': 'admin',
                                    'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                    'name': 'member2',
                                    'userId': 'member2',
                                    'status': 'active'
                                },
                                {
                                    'agg': [
                                        {
                                            'metric': 'completedCount',
                                            'lastUpdatedOn': 1594734198,
                                            'value': 20
                                        }
                                    ],
                                    'role': 'admin',
                                    'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                    'name': 'member2',
                                    'userId': 'member2',
                                    'status': 'active'
                                },
                                {
                                    'agg': [
                                        {
                                            'metric': 'completedCount',
                                            'lastUpdatedOn': 1594734198,
                                            'value': 0
                                        }
                                    ],
                                    'role': 'admin',
                                    'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                    'name': 'member3',
                                    'userId': 'member3',
                                    'status': 'active'
                                },
                                {
                                    'agg': [
                                        {
                                            'metric': 'completedCount',
                                            'lastUpdatedOn': 1594734198,
                                            'value': 40
                                        }
                                    ],
                                    'role': 'admin',
                                    'createdBy': 'ec861024-c55f-4ca0-80fa-17e1575718d9',
                                    'name': 'member3',
                                    'userId': 'member3',
                                    'status': 'active'
                                }
                            ]
                        }
                    };
                    return of(response);
                });

                const activity = {
                    id: 'do_11305913172235878411827',
                    type: 'Course'
                };

                const mergeGroup = {
                    'activities': [
                        {
                            id: 'do_11305913172235878411827',
                            type: 'Course',
                            activityInfo: {
                                identifier: 'do_21301074192677273611434',
                                appIcon: 'https://ntpstagingall.blob.core.windows.net/ntp-content-staging/content/do_2127814568517795841477/artifact/100x100_1560236432219.jpg',
                                name: ' "Courses Batches" ',
                                organisation: ['Odisha'],
                                topic: ['Teaching and Classroom Management', 'Leadership Management', 'ICT'],
                                language: ['English'],
                                mimeType: 'application/vnd.ekstep.content-collection',
                                contentType: 'Course',
                                objectType: 'Content',
                                resourceType: 'Course',
                                leafNodesCount: 1000
                            }
                        }
                    ],
                    'members': [
                        {
                            'userId': 'member3',
                            'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                            'role': 'admin',
                            'status': 'active',
                            'createdOn': '2020-07-15 11:44:07:291+0000',
                            'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                            'name': 'member3'
                        },
                        {
                            'userId': 'member1',
                            'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                            'role': 'admin',
                            'status': 'active',
                            'createdOn': '2020-07-15 11:44:07:291+0000',
                            'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                            'name': 'member1'
                        },
                        {
                            'userId': 'member2',
                            'groupId': 'fee4fc21-dbef-4b32-bc31-de6f7b07c587',
                            'role': 'admin',
                            'status': 'active',
                            'createdOn': '2020-07-15 11:44:07:291+0000',
                            'createdBy': '1c8b6384-27aa-4dcf-a7e7-c2cecb7db26a',
                            'name': 'member2'
                        }
                    ]
                } as Partial<Group>;

                activityService.getDataAggregation('SOME_GROUP_ID', activity, mergeGroup as Group, 100).subscribe((response) => {
                    expect(response.members).toEqual([
                        expect.objectContaining({
                            name: 'member3',
                            agg: expect.arrayContaining([
                                expect.objectContaining({
                                    metric: CsGroupActivityAggregationMetric.PROGRESS,
                                    lastUpdatedOn: expect.anything(),
                                    value: 40
                                }),
                            ]),
                        }),
                        expect.objectContaining({
                            name: 'member1',
                            agg: expect.arrayContaining([
                                expect.objectContaining({
                                    metric: CsGroupActivityAggregationMetric.PROGRESS,
                                    lastUpdatedOn: expect.anything(),
                                    value: 100
                                }),
                            ]),
                        }),
                        expect.objectContaining({
                            name: 'member2',
                            agg: expect.arrayContaining([
                                expect.objectContaining({
                                    metric: CsGroupActivityAggregationMetric.PROGRESS,
                                    lastUpdatedOn: expect.anything(),
                                    value: 20
                                }),
                            ]),
                        })
                    ]);
                    done();
                });
            });
        });

        it('should merge missing metric leafNodesCount into response when mergeGroup provided', (done) => {
            mockHttpService.fetch = jest.fn(() => {
                const response = new CsResponse();
                response.responseCode = 200;
                response.body = {
                    result: {
                        'activity': {
                            'agg': [
                                {
                                    'metric': 'enrolmentCount',
                                    'lastUpdatedOn': '1594734425894',
                                    'value': 1
                                }
                            ],
                            'id': 'do_11305913172235878411827',
                            'type': 'course'
                        },
                        'groupId': 'f5fd09d5-7697-4c54-bb25-28758c9a2a45',
                        'members': []
                    }
                };
                return of(response);
            });

            const activity = {
                id: 'do_11305913172235878411827',
                type: 'Course'
            };

            const mergeGroup = {
                activities: [
                    {
                        id: 'do_11305913172235878411827',
                        type: 'Course',
                        activityInfo: {
                            identifier: 'do_21301074192677273611434',
                            appIcon: 'https://ntpstagingall.blob.core.windows.net/ntp-content-staging/content/do_2127814568517795841477/artifact/100x100_1560236432219.jpg',
                            name: ' "Courses Batches" ',
                            organisation: ['Odisha'],
                            topic: ['Teaching and Classroom Management', 'Leadership Management', 'ICT'],
                            language: ['English'],
                            mimeType: 'application/vnd.ekstep.content-collection',
                            contentType: 'Course',
                            objectType: 'Content',
                            resourceType: 'Course',
                            leafNodesCount: 100
                        }
                    }
                ],
                members: []
            } as Partial<Group>;

            activityService.getDataAggregation('SOME_GROUP_ID', activity, mergeGroup as Group).subscribe((response) => {
                expect(response.activity).toEqual(expect.objectContaining({
                    agg: expect.arrayContaining([
                        expect.objectContaining({
                            metric: CsGroupActivityAggregationMetric.ENROLMENT_COUNT,
                            lastUpdatedOn: '1594734425894',
                            value: 1
                        }),
                        expect.objectContaining({
                            metric: CsGroupActivityAggregationMetric.LEAF_NODES_COUNT,
                            value: 100
                        })
                    ]),
                }));
                done();
            });
        });

        it('should build empty response for client error - "No member found in this group"', (done) => {
            mockHttpService.fetch = jest.fn(() => {
                const response = new CsResponse();
                response.responseCode = 400;
                response.body = {
                    'id': 'api.group.activity.agg',
                    'ver': 'v1',
                    'ts': '2020-07-15 09:51:14:366+0000',
                    'params': {
                        'resmsgid': null,
                        'msgid': '5e04c8b7-9fac-4f14-9158-7a63d5292c1b',
                        'err': null,
                        'status': 'SERVER_ERROR',
                        'errmsg': 'No member found in this group.'
                    },
                    'responseCode': 'CLIENT_ERROR',
                    'result': {}
                };
                return throwError(new CsHttpClientError('CLIENT_ERROR', response));
            });

            const activity = {
                id: 'do_11305913172235878411827',
                type: 'Course'
            };

            const mergeGroup = {
                activities: [
                    {
                        id: 'do_11305913172235878411827',
                        type: 'Course',
                        activityInfo: {
                            identifier: 'do_21301074192677273611434',
                            appIcon: 'https://ntpstagingall.blob.core.windows.net/ntp-content-staging/content/do_2127814568517795841477/artifact/100x100_1560236432219.jpg',
                            name: ' "Courses Batches" ',
                            organisation: ['Odisha'],
                            topic: ['Teaching and Classroom Management', 'Leadership Management', 'ICT'],
                            language: ['English'],
                            mimeType: 'application/vnd.ekstep.content-collection',
                            contentType: 'Course',
                            objectType: 'Content',
                            resourceType: 'Course',
                            leafNodesCount: 100
                        }
                    }
                ],
                members: []
            } as Partial<Group>;

            activityService.getDataAggregation('SOME_GROUP_ID', activity, mergeGroup as Group).subscribe((response) => {
                expect(response).toEqual(expect.objectContaining({
                    activity: {
                        agg: expect.arrayContaining([
                            expect.objectContaining({
                                metric: CsGroupActivityAggregationMetric.ENROLMENT_COUNT as any,
                                value: 0
                            }),
                            expect.objectContaining({
                                metric: CsGroupActivityAggregationMetric.LEAF_NODES_COUNT as any,
                                value: 100
                            })
                        ]),
                        id: activity.id,
                        type: activity.type
                    },
                    groupId: 'SOME_GROUP_ID',
                    members: []
                }));
                done();
            });
        });
    });

    describe('getflatjson', () => {
        const HierarchyData = {
            "id": "api.course.hierarchy",
            "ver": "1.0",
            "ts": "2021-05-17T04:05:18.712Z",
            "params": {
              "resmsgid": "17af7780-b6c5-11eb-beda-f91d28ef7717",
              "msgid": "d99e22d6-68c4-d0a9-4be3-f57164616873",
              "status": "successful",
              "err": null,
              "errmsg": null
            },
            "responseCode": "OK",
            "result": {
              "content": {
                "ownershipType": [
                  "createdBy"
                ],
                "copyright": "KirubaOrg2.1",
                "keywords": [
                  "2.0",
                  "EGADXN"
                ],
                "c_diksha_preprod_private_batch_count": 0,
                "subject": [
                  "Chemistry"
                ],
                "channel": "01269878797503692810",
                "downloadUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000623_do_2129767578773995521545_1.0_spine.ecar",
                "organisation": [
                  "Tamil Nadu"
                ],
                "language": [
                  "English"
                ],
                "mimeType": "application/vnd.ekstep.content-collection",
                "variants": {
                  "online": {
                    "ecarUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000745_do_2129767578773995521545_1.0_online.ecar",
                    "size": 8033
                  },
                  "spine": {
                    "ecarUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000623_do_2129767578773995521545_1.0_spine.ecar",
                    "size": 87475
                  }
                },
                "leafNodes": [
                  "do_2129505877663989761263",
                  "do_31277365926529433615491",
                  "do_2129493337594429441162"
                ],
                "objectType": "Content",
                "gradeLevel": [
                  "Class 2"
                ],
                "appIcon": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/do_2129753394372198401551/artifact/images_1580986881942.thumb.png",
                "children": [
                  {
                    "parent": "do_2129767578773995521545",
                    "identifier": "do_2129767578779320321547",
                    "copyright": "KirubaOrg2.1",
                    "lastStatusChangedOn": "2020-03-13T05:21:29.396+0000",
                    "code": "do_2129767578779320321547",
                    "visibility": "Parent",
                    "index": 1,
                    "mimeType": "application/vnd.ekstep.content-collection",
                    "createdOn": "2020-03-13T05:21:29.396+0000",
                    "versionKey": "1584076889396",
                    "framework": "TPD",
                    "depth": 1,
                    "children": [
                      {
                        "ownershipType": [
                          "createdFor"
                        ],
                        "copyright": "Tamilnadu",
                        "previewUrl": "https://ntpproductionall.blob.core.windows.net/ntp-content-production/content/assets/do_31277365926529433615491/b369u4p93as-egadxn-tirrnnn-arrivoom-ilkknnm-potu.pdf",
                        "keywords": [
                          "EGADXN",
                          "2.0"
                        ],
                        "subject": [
                          "Tamil"
                        ],
                        "downloadUrl": "https://ntpproductionall.blob.core.windows.net/ntp-content-production/ecar_files/do_31277365926529433615491/tirrnnn-arrivoom-ilkknnm-potu_1572421341178_do_31277365926529433615491_2.0.ecar",
                        "channel": "01235953109336064029450",
                        "questions": [],
                        "organisation": [
                          "Tamilnadu"
                        ],
                        "showNotification": true,
                        "language": [
                          "English"
                        ],
                        "variants": {
                          "spine": {
                            "ecarUrl": "https://ntpproductionall.blob.core.windows.net/ntp-content-production/ecar_files/do_31277365926529433615491/tirrnnn-arrivoom-ilkknnm-potu_1572421341304_do_31277365926529433615491_2.0_spine.ecar",
                            "size": 12376
                          }
                        },
                        "mimeType": "application/pdf",
                        "appIcon": "https://ntpproductionall.blob.core.windows.net/ntp-content-production/content/do_31277365926529433615491/artifact/b369u4p93as-egadxn-ararar-arca-arar-ararua-arra-arar2ara-ararpsarra-araa-ara-_1559284616577.thumb.png",
                        "gradeLevel": [
                          "Class 10"
                        ],
                        "appId": "prod.diksha.app",
                        "usesContent": [],
                        "artifactUrl": "https://ntpproductionall.blob.core.windows.net/ntp-content-production/content/assets/do_31277365926529433615491/b369u4p93as-egadxn-tirrnnn-arrivoom-ilkknnm-potu.pdf",
                        "contentEncoding": "identity",
                        "lockKey": "199bf85c-0c88-4975-bbc3-96d78e4eb8eb",
                        "contentType": "Resource",
                        "lastUpdatedBy": "032b9b66-5faa-4391-8090-ffe3c97a0811",
                        "identifier": "do_31277365926529433615491",
                        "audience": [
                          "Learner"
                        ],
                        "visibility": "Default",
                        "author": "Tamilnadu",
                        "consumerId": "e85bcfb5-a8c2-4e65-87a2-0ebb43b45f01",
                        "mediaType": "content",
                        "itemSets": [],
                        "osId": "org.ekstep.quiz.app",
                        "lastPublishedBy": "50eda819-a9ca-431e-874c-cdebc60cf64e",
                        "version": 1,
                        "pragma": [
                          "external"
                        ],
                        "license": "CC BY 4.0",
                        "prevState": "Review",
                        "size": 775675,
                        "lastPublishedOn": "2019-10-30T07:42:21.173+0000",
                        "concepts": [],
                        "name": "திறன் அறிவோம் இலக்கணம்-பொது",
                        "status": "Live",
                        "code": "84c17c44-ead4-46ce-a64b-2ab4013796a5",
                        "methods": [],
                        "description": "B369U4P93AS",
                        "medium": [
                          "Tamil"
                        ],
                        "streamingUrl": "https://ntpproductionall.blob.core.windows.net/ntp-content-production/content/assets/do_31277365926529433615491/b369u4p93as-egadxn-tirrnnn-arrivoom-ilkknnm-potu.pdf",
                        "posterImage": "https://ntpproductionall.blob.core.windows.net/ntp-content-production/content/do_31277365957720473615492/artifact/b369u4p93as-egadxn-ararar-arca-arar-ararua-arra-arar2ara-ararpsarra-araa-ara-_1559284616577.png",
                        "idealScreenSize": "normal",
                        "createdOn": "2019-10-09T10:00:00.000+0000",
                        "copyrightYear": 2019,
                        "contentDisposition": "inline",
                        "lastUpdatedOn": "2019-10-30T07:42:20.741+0000",
                        "SYS_INTERNAL_LAST_UPDATED_ON": "2019-12-10T01:17:08.256+0000",
                        "dialcodeRequired": "No",
                        "owner": "Tamilnadu",
                        "createdFor": [
                          "01235953109336064029450"
                        ],
                        "creator": "TN SCERT SCERT",
                        "lastStatusChangedOn": "2019-10-30T07:42:20.733+0000",
                        "os": [
                          "All"
                        ],
                        "libraries": [],
                        "pkgVersion": 2,
                        "versionKey": "1572421340982",
                        "idealScreenDensity": "hdpi",
                        "framework": "tn_k-12_5",
                        "s3Key": "ecar_files/do_31277365926529433615491/tirrnnn-arrivoom-ilkknnm-potu_1572421341178_do_31277365926529433615491_2.0.ecar",
                        "me_averageRating": 4,
                        "lastSubmittedOn": "2019-10-30T07:36:03.266+0000",
                        "createdBy": "032b9b66-5faa-4391-8090-ffe3c97a0811",
                        "compatibilityLevel": 4,
                        "ownedBy": "01235953109336064029450",
                        "board": "State (Tamil Nadu)",
                        "resourceType": "Learn",
                        "index": 1,
                        "depth": 2,
                        "parent": "do_2129767578779320321547",
                        "primaryCategory": "Learning Resource"
                      }
                    ],
                    "name": "Unit 1",
                    "lastUpdatedOn": "2020-03-13T05:23:20.149+0000",
                    "contentType": "CourseUnit",
                    "status": "Live",
                    "compatibilityLevel": 1,
                    "lastPublishedOn": "2020-03-13T05:23:20.256+0000",
                    "pkgVersion": 1,
                    "leafNodesCount": 1,
                    "downloadUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000623_do_2129767578773995521545_1.0_spine.ecar",
                    "variants": "{\"online\":{\"ecarUrl\":\"https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000745_do_2129767578773995521545_1.0_online.ecar\",\"size\":8033.0},\"spine\":{\"ecarUrl\":\"https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000623_do_2129767578773995521545_1.0_spine.ecar\",\"size\":87475.0}}",
                    "primaryCategory": "Course Unit",
                    "audience": [
                      "Teacher"
                    ]
                  },
                  {
                    "parent": "do_2129767578773995521545",
                    "identifier": "do_2129767578779402241548",
                    "copyright": "KirubaOrg2.1",
                    "lastStatusChangedOn": "2020-03-13T05:21:29.397+0000",
                    "code": "831f00dc-d8ae-4e81-88db-5e0074707f57",
                    "visibility": "Parent",
                    "index": 2,
                    "mimeType": "application/vnd.ekstep.content-collection",
                    "createdOn": "2020-03-13T05:21:29.397+0000",
                    "versionKey": "1584076889397",
                    "framework": "TPD",
                    "depth": 1,
                    "children": [
                      {
                        "ownershipType": [
                          "createdBy"
                        ],
                        "previewUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/ecml/do_2129493337594429441162-latest",
                        "plugins": [
                        ],
                        "downloadUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129493337594429441162/kiruba-self-assess_1580729454951_do_2129493337594429441162_1.0.ecar",
                        "channel": "01275678925675724817",
                        "questions": [
                          {
                            "identifier": "do_2129174021075271681233",
                            "name": "Explore Question 4",
                            "objectType": "AssessmentItem",
                            "relation": "associatedTo",
                            "description": "By kiruba",
                            "status": "Live"
                          },
                          {
                            "identifier": "do_2129174008785797121231",
                            "name": "Explore Question 2",
                            "objectType": "AssessmentItem",
                            "relation": "associatedTo",
                            "description": "By kiruba",
                            "status": "Live"
                          },
                          {
                            "identifier": "do_2129173993575219201147",
                            "name": "Explore Question 1",
                            "objectType": "AssessmentItem",
                            "relation": "associatedTo",
                            "description": "By kiruba",
                            "status": "Live"
                          },
                          {
                            "identifier": "do_2129174037204910081236",
                            "name": "Explore Question 6",
                            "objectType": "AssessmentItem",
                            "relation": "associatedTo",
                            "description": "By kiruba",
                            "status": "Live"
                          },
                          {
                            "identifier": "do_2129195303901757441628",
                            "name": "Question 7",
                            "objectType": "AssessmentItem",
                            "relation": "associatedTo",
                            "description": "By kiruba",
                            "status": "Live"
                          },
                          {
                            "identifier": "do_2129195314499747841629",
                            "name": "Question 8",
                            "objectType": "AssessmentItem",
                            "relation": "associatedTo",
                            "description": "By kiruba",
                            "status": "Live"
                          },
                          {
                            "identifier": "do_2129174014605885441232",
                            "name": "Explore Question 3",
                            "objectType": "AssessmentItem",
                            "relation": "associatedTo",
                            "description": "By kiruba",
                            "status": "Live"
                          },
                          {
                            "identifier": "do_2129174030324285441235",
                            "name": "Explore Question 5",
                            "objectType": "AssessmentItem",
                            "relation": "associatedTo",
                            "description": "By kiruba",
                            "status": "Live"
                          }
                        ],
                        "organisation": [
                          "preprod-sso"
                        ],
                        "language": [
                          "English"
                        ],
                        "variants": {
                          "spine": {
                            "ecarUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129493337594429441162/kiruba-self-assess_1580729455024_do_2129493337594429441162_1.0_spine.ecar",
                            "size": 1162
                          }
                        },
                        "mimeType": "application/vnd.ekstep.ecml-archive",
                        "editorState": "{\"plugin\":{\"noOfExtPlugins\":13,\"extPlugins\":[{\"plugin\":\"org.ekstep.contenteditorfunctions\",\"version\":\"1.2\"},{\"plugin\":\"org.ekstep.keyboardshortcuts\",\"version\":\"1.0\"},{\"plugin\":\"org.ekstep.richtext\",\"version\":\"1.0\"},{\"plugin\":\"org.ekstep.iterator\",\"version\":\"1.0\"},{\"plugin\":\"org.ekstep.navigation\",\"version\":\"1.0\"},{\"plugin\":\"org.ekstep.reviewercomments\",\"version\":\"1.0\"},{\"plugin\":\"org.ekstep.questionunit.mtf\",\"version\":\"1.2\"},{\"plugin\":\"org.ekstep.questionunit.mcq\",\"version\":\"1.3\"},{\"plugin\":\"org.ekstep.keyboard\",\"version\":\"1.1\"},{\"plugin\":\"org.ekstep.questionunit.reorder\",\"version\":\"1.1\"},{\"plugin\":\"org.ekstep.questionunit.sequence\",\"version\":\"1.1\"},{\"plugin\":\"org.ekstep.questionunit.ftb\",\"version\":\"1.1\"},{\"plugin\":\"org.ekstep.summary\",\"version\":\"1.0\"}]},\"stage\":{\"noOfStages\":3,\"currentStage\":\"c37e17de-72dd-40ae-9578-ee2db02d1c55\",\"selectedPluginObject\":\"d901e2e9-67d3-4537-a326-432d5d921e87\"},\"sidebar\":{\"selectedMenu\":\"settings\"}}",
                        "appId": "preprod.diksha.portal",
                        "artifactUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/do_2129493337594429441162/artifact/1580729454852_do_2129493337594429441162.zip",
                        "contentEncoding": "gzip",
                        "lockKey": "fc25ffac-91b7-4445-aa23-bd56f50099e7",
                        "contentType": "SelfAssess",
                        "lastUpdatedBy": "9e64cc1b-f9f0-4642-8cb3-4fb4afcb5c77",
                        "identifier": "do_2129493337594429441162",
                        "audience": [
                          "Learner"
                        ],
                        "visibility": "Default",
                        "consumerId": "69810204-163b-4dc1-ac2a-c954eb202457",
                        "mediaType": "content",
                        "osId": "org.ekstep.quiz.app",
                        "lastPublishedBy": "Ekstep",
                        "version": 2,
                        "prevState": "Draft",
                        "license": "CC BY 4.0",
                        "size": 414972,
                        "lastPublishedOn": "2020-02-03T11:30:54.948+0000",
                        "name": "kiruba self assess",
                        "status": "Live",
                        "totalQuestions": 8,
                        "code": "org.sunbird.cQFPpi",
                        "description": "Enter description for Resource",
                        "streamingUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/ecml/do_2129493337594429441162-latest",
                        "idealScreenSize": "normal",
                        "createdOn": "2020-02-03T11:26:58.688+0000",
                        "contentDisposition": "inline",
                        "lastUpdatedOn": "2020-02-03T11:30:53.124+0000",
                        "SYS_INTERNAL_LAST_UPDATED_ON": "2020-02-03T11:30:56.499+0000",
                        "dialcodeRequired": "No",
                        "createdFor": [
                          "01275678925675724817"
                        ],
                        "creator": "K13 Content Creator",
                        "lastStatusChangedOn": "2020-02-03T11:30:56.491+0000",
                        "os": [
                          "All"
                        ],
                        "totalScore": 8,
                        "pkgVersion": 1,
                        "versionKey": "1580729453124",
                        "idealScreenDensity": "hdpi",
                        "s3Key": "ecar_files/do_2129493337594429441162/kiruba-self-assess_1580729454951_do_2129493337594429441162_1.0.ecar",
                        "framework": "ncert_k-12",
                        "createdBy": "9e64cc1b-f9f0-4642-8cb3-4fb4afcb5c77",
                        "compatibilityLevel": 2,
                        "resourceType": "Practice",
                        "index": 1,
                        "depth": 2,
                        "parent": "do_2129767578779402241548",
                        "primaryCategory": "Course Assessment"
                      }
                    ],
                    "name": "Test 1",
                    "lastUpdatedOn": "2020-03-13T05:23:20.149+0000",
                    "contentType": "CourseUnit",
                    "status": "Live",
                    "compatibilityLevel": 1,
                    "lastPublishedOn": "2020-03-13T05:23:20.256+0000",
                    "pkgVersion": 1,
                    "leafNodesCount": 1,
                    "downloadUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000623_do_2129767578773995521545_1.0_spine.ecar",
                    "variants": "{\"online\":{\"ecarUrl\":\"https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000745_do_2129767578773995521545_1.0_online.ecar\",\"size\":8033.0},\"spine\":{\"ecarUrl\":\"https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000623_do_2129767578773995521545_1.0_spine.ecar\",\"size\":87475.0}}",
                    "primaryCategory": "Course Unit",
                    "audience": [
                      "Teacher"
                    ]
                  },
                  {
                    "parent": "do_2129767578773995521545",
                    "identifier": "do_2129767578779320321546",
                    "copyright": "KirubaOrg2.1",
                    "lastStatusChangedOn": "2020-03-13T05:21:29.396+0000",
                    "code": "29392b5e-cf73-4886-9f8f-2e297f7eea80",
                    "visibility": "Parent",
                    "index": 3,
                    "mimeType": "application/vnd.ekstep.content-collection",
                    "createdOn": "2020-03-13T05:21:29.396+0000",
                    "versionKey": "1584076889396",
                    "framework": "TPD",
                    "depth": 1,
                    "children": [
                      {
                        "ownershipType": [
                          "createdBy"
                        ],
                        "copyright": "KirubaOrg2.1",
                        "previewUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/ecml/do_2129505877663989761263-latest",
                        "plugins": [
                        ],
                        "downloadUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129505877663989761263/feb-05-self-assess_1580883684747_do_2129505877663989761263_3.0.ecar",
                        "channel": "0127920475840593920",
                        "questions": [],
                        "organisation": [
                          "KirubaOrg2.1"
                        ],
                        "language": [
                          "English"
                        ],
                        "variants": {
                          "spine": {
                            "ecarUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129505877663989761263/feb-05-self-assess_1580883684871_do_2129505877663989761263_3.0_spine.ecar",
                            "size": 45946
                          }
                        },
                        "mimeType": "application/vnd.ekstep.ecml-archive",
                        "editorState": "{\"plugin\":{\"noOfExtPlugins\":13,\"extPlugins\":[{\"plugin\":\"org.ekstep.contenteditorfunctions\",\"version\":\"1.2\"},{\"plugin\":\"org.ekstep.keyboardshortcuts\",\"version\":\"1.0\"},{\"plugin\":\"org.ekstep.richtext\",\"version\":\"1.0\"},{\"plugin\":\"org.ekstep.iterator\",\"version\":\"1.0\"},{\"plugin\":\"org.ekstep.navigation\",\"version\":\"1.0\"},{\"plugin\":\"org.ekstep.reviewercomments\",\"version\":\"1.0\"},{\"plugin\":\"org.ekstep.questionunit.mtf\",\"version\":\"1.2\"},{\"plugin\":\"org.ekstep.questionunit.mcq\",\"version\":\"1.3\"},{\"plugin\":\"org.ekstep.keyboard\",\"version\":\"1.1\"},{\"plugin\":\"org.ekstep.questionunit.reorder\",\"version\":\"1.1\"},{\"plugin\":\"org.ekstep.questionunit.sequence\",\"version\":\"1.1\"},{\"plugin\":\"org.ekstep.questionunit.ftb\",\"version\":\"1.1\"},{\"plugin\":\"org.ekstep.summary\",\"version\":\"1.0\"}]},\"stage\":{\"noOfStages\":3,\"currentStage\":\"ce156437-cc87-4de1-989e-ba8d2d9ed040\",\"selectedPluginObject\":\"23c1e8e6-8dc6-4b3a-badb-d800127035dd\"},\"sidebar\":{\"selectedMenu\":\"settings\"}}",
                        "appIcon": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/do_2129505877663989761263/artifact/download-1_1580877495193.thumb.jpg",
                        "appId": "preprod.diksha.portal",
                        "usesContent": [],
                        "artifactUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/do_2129505877663989761263/artifact/1580883377371_do_2129505877663989761263.zip",
                        "contentEncoding": "gzip",
                        "lockKey": "add4fb4c-7d0c-4b54-be32-2bbb522a2827",
                        "contentType": "SelfAssess",
                        "lastUpdatedBy": "7e726898-0635-44cf-81ff-3b3a889c8dba",
                        "identifier": "do_2129505877663989761263",
                        "audience": [
                          "Learner"
                        ],
                        "visibility": "Default",
                        "consumerId": "2eaff3db-cdd1-42e5-a611-bebbf906e6cf",
                        "mediaType": "content",
                        "itemSets": [],
                        "osId": "org.ekstep.quiz.app",
                        "lastPublishedBy": "Ekstep",
                        "version": 2,
                        "prevState": "Draft",
                        "license": "CC BY 4.0",
                        "size": 458458,
                        "lastPublishedOn": "2020-02-05T06:21:24.744+0000",
                        "concepts": [],
                        "name": "Feb-05 self assess",
                        "status": "Live",
                        "totalQuestions": 6,
                        "code": "org.sunbird.wVQ7Qc",
                        "prevStatus": "Draft",
                        "methods": [],
                        "description": "By kiruba",
                        "streamingUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/ecml/do_2129505877663989761263-latest",
                        "posterImage": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/do_2129505484397527041246/artifact/download-1_1580877495193.jpg",
                        "idealScreenSize": "normal",
                        "createdOn": "2020-02-05T05:58:15.708+0000",
                        "contentDisposition": "inline",
                        "lastUpdatedOn": "2020-02-05T06:21:24.401+0000",
                        "SYS_INTERNAL_LAST_UPDATED_ON": "2020-02-05T06:21:26.086+0000",
                        "dialcodeRequired": "No",
                        "createdFor": [
                          "0127920475840593920"
                        ],
                        "creator": "Batch Mentor2",
                        "lastStatusChangedOn": "2020-02-05T06:21:24.386+0000",
                        "os": [
                          "All"
                        ],
                        "libraries": [],
                        "totalScore": 6,
                        "pkgVersion": 3,
                        "versionKey": "1580883684543",
                        "idealScreenDensity": "hdpi",
                        "s3Key": "ecar_files/do_2129505877663989761263/feb-05-self-assess_1580883684747_do_2129505877663989761263_3.0.ecar",
                        "framework": "NCF",
                        "createdBy": "7e726898-0635-44cf-81ff-3b3a889c8dba",
                        "compatibilityLevel": 2,
                        "resourceType": "Learn",
                        "index": 1,
                        "depth": 2,
                        "parent": "do_2129767578779320321546",
                        "primaryCategory": "Course Assessment"
                      }
                    ],
                    "name": "Test 2",
                    "lastUpdatedOn": "2020-03-13T05:23:20.149+0000",
                    "contentType": "CourseUnit",
                    "status": "Live",
                    "compatibilityLevel": 1,
                    "lastPublishedOn": "2020-03-13T05:23:20.256+0000",
                    "pkgVersion": 1,
                    "leafNodesCount": 1,
                    "downloadUrl": "https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000623_do_2129767578773995521545_1.0_spine.ecar",
                    "variants": "{\"online\":{\"ecarUrl\":\"https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000745_do_2129767578773995521545_1.0_online.ecar\",\"size\":8033.0},\"spine\":{\"ecarUrl\":\"https://preprodall.blob.core.windows.net/ntp-content-preprod/ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000623_do_2129767578773995521545_1.0_spine.ecar\",\"size\":87475.0}}",
                    "primaryCategory": "Course Unit",
                    "audience": [
                      "Teacher"
                    ]
                  }
                ],
                "collections": [],
                "primaryCategory": "Course",
                "appId": "preprod.diksha.portal",
                "contentEncoding": "gzip",
                "lockKey": "9f7fc44f-4bfd-497d-90b9-02a3791c821d",
                "totalCompressedSize": 1649105,
                "mimeTypesCount": "{\"application/pdf\":1,\"application/vnd.ekstep.content-collection\":3,\"application/vnd.ekstep.ecml-archive\":2}",
                "contentType": "Course",
                "identifier": "do_2129767578773995521545",
                "audience": [
                  "Teacher"
                ],
                "toc_url": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/do_2129767578773995521545/artifact/do_2129767578773995521545_toc.json",
                "visibility": "Default",
                "contentTypesCount": "{\"CourseUnit\":3,\"Resource\":1,\"SelfAssess\":2}",
                "author": "kiruba",
                "consumerId": "2eaff3db-cdd1-42e5-a611-bebbf906e6cf",
                "childNodes": [
                  "do_2129767578779320321546",
                  "do_2129767578779320321547",
                  "do_2129767578779402241548",
                  "do_2129505877663989761263",
                  "do_31277365926529433615491",
                  "do_2129493337594429441162"
                ],
                "mediaType": "content",
                "osId": "org.ekstep.quiz.app",
                "lastPublishedBy": "08631a74-4b94-4cf7-a818-831135248a4a",
                "version": 2,
                "license": "CC BY 4.0",
                "prevState": "Review",
                "size": 87475,
                "lastPublishedOn": "2020-03-13T05:23:20.256+0000",
                "name": "vk-2.8CourseWithAssessment5",
                "topic": [
                  "Teaching and Classroom Management"
                ],
                "status": "Live",
                "code": "org.sunbird.qdQpaJ.copy.copy.copy.copy",
                "prevStatus": "Processing",
                "origin": "do_2129760324172267521517",
                "description": "By kiruba",
                "medium": [
                  "Telugu"
                ],
                "posterImage": "https://preprodall.blob.core.windows.net/ntp-content-preprod/content/do_2129514445339033601158/artifact/images_1580986881942.png",
                "idealScreenSize": "normal",
                "createdOn": "2020-03-13T05:21:29.332+0000",
                "reservedDialcodes": {
                  "P7T4D6": 0
                },
                "copyrightYear": 2020,
                "contentDisposition": "inline",
                "licenseterms": "By creating any type of content (resources, books, courses etc.) on DIKSHA, you consent to publish it under the Creative Commons License Framework. Please choose the applicable creative commons license you wish to apply to your content.",
                "lastUpdatedOn": "2020-03-13T05:23:20.149+0000",
                "originData": {
                  "license": "CC BY 4.0",
                  "author": "kiruba",
                  "name": "vk-2.8CourseWithAssessment4",
                  "organisation": [
                    "Tamil Nadu"
                  ]
                },
                "SYS_INTERNAL_LAST_UPDATED_ON": "2020-03-13T05:23:20.823+0000",
                "dialcodeRequired": "No",
                "lastStatusChangedOn": "2020-03-13T05:23:20.815+0000",
                "createdFor": [
                  "01269878797503692810"
                ],
                "creator": "Content_creator_TN",
                "os": [
                  "All"
                ],
                "c_diksha_preprod_open_batch_count": 1,
                "pkgVersion": 1,
                "versionKey": "1584077000149",
                "idealScreenDensity": "hdpi",
                "framework": "TPD",
                "depth": 0,
                "s3Key": "ecar_files/do_2129767578773995521545/vk-2.8coursewithassessment5_1584077000623_do_2129767578773995521545_1.0_spine.ecar",
                "lastSubmittedOn": "2020-03-13T05:22:35.815+0000",
                "createdBy": "4cd4c690-eab6-4938-855a-447c7b1b8ea9",
                "compatibilityLevel": 4,
                "leafNodesCount": 3,
                "usedByContent": [],
                "resourceType": "Course"
              }
            }
        }
        const AggDataCSL = {
            "activity": {
              "id": "do_2129767578773995521545",
              "type": "Course",
              "agg": [
                {
                  "metric": "enrolmentCount",
                  "lastUpdatedOn": 1620813324281,
                  "value": 2
                },
                {
                  "metric": "leafNodesCount",
                  "lastUpdatedOn": 1621231520634,
                  "value": 3
                }
              ]
            },
            "groupId": "b85d488d-637a-484d-9c2c-405d565dca55",
            "members": [
              {
                "agg": [
                    {
                        "metric":"score:do_2134461695288360961162",
                        "value":4,
                        "lastUpdatedOn":1642487743606
                     },
                     {
                        "metric":"completedCount",
                        "value":6,
                        "lastUpdatedOn":1642487783882
                     },
                     {
                        "metric":"max_score:do_2134461695288360961162",
                        "value":4,
                        "lastUpdatedOn":1642487743606
                     },
                     {
                        "metric": "progress",
                        "lastUpdatedOn": 1621231520634,
                        "value": 67
                     }
                ],
                "name": "Balakrishna M",
                "role": "admin",
                "status": "active",
                "createdBy": "9d079666-ac84-41e7-bed1-343744548f90",
                "userId": "9d079666-ac84-41e7-bed1-343744548f90"
              },
              {
                "agg": [
                  {
                    "metric": "completedCount",
                    "value": 2,
                    "lastUpdatedOn": 1620813324281
                  },
                  {
                    "metric": "score:do_2129493337594429441162",
                    "value": 1,
                    "lastUpdatedOn": 1620642987500
                  },
                  {
                    "metric": "progress",
                    "lastUpdatedOn": 1621231520634,
                    "value": 67
                  }
                ],
                "name": "Balakrishna M",
                "role": "member",
                "status": "active",
                "createdBy": "9d079666-ac84-41e7-bed1-343744548f90",
                "userId": "56bdaa45-0b81-4d46-81b3-a820b150ff63"
              }
            ]
          }
        it('should give assessments', () => {
            // activityService.getAssessments(HierarchyData.result.content.children, {})
            activityService.getDataForDashlets(HierarchyData.result.content.children, AggDataCSL)
        })
    });
});
