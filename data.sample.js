/*!
 * netGraph data
 * Script with initial data
 * @version 0.0.1
 * @copyright Rabit <home@rabits.org>
 * @license MIT
 */
'use strict'

// Sample data to show some example structure

// My Super Mega Team
DATA.nodes.push(new Network.Owner({
  id: 'smt',
  name: 'Super Mega Team',
  childrens: [
    new Network.Project({
      id: 'company-smt-dev',
      childrens: [
        new Network.Net({
          id: 'smt-dev-net',
          parent: 'company-spn-dev',
          childrens: [
            new Network.Subnet({
              id: 'smt-dev-central1-01',
              cidr: '192.168.180.0/24',
              childrens: [
                new Network.Service({
                  id: 'smt-jenkins',
                  url: 'https://smt-jenkins.company.com/',
                  tags: [
                    'smt-all',
                    'smt-jenkins',
                  ],
                }),
                new Network.Environment({
                  id: 'smt-dev',
                  childrens: [
                    new Network.Service({
                      id: 'smt-dev-airflow',
                      name: 'smt-airflow-dev',
                      description: 'Airflow cluster',
                      url: 'https://smt-airflow-dev.company.com/',
                      tags: [
                        'smt-all',
                        'smt-airflow',
                      ],
                    }),
                    new Network.Service({
                      id: 'smt-dev-dataproc',
                      name: 'smt-dev-p1-dataproc',
                      description: 'Dataproc cluster',
                      tags: [
                        'smt-all',
                        'smt-dataproc',
                      ],
                    }),
                    new Network.Service({
                      id: 'smt-dev-kafka',
                      name: 'smt-analytics-dev01-kafka',
                      description: 'Kafka cluster',
                      tags: [
                        'smt-all',
                        'smt-kafka',
                      ],
                    }),
                    new Network.Service({
                      id: 'smt-dev-zookeeper',
                      name: 'smt-analytics-dev01-zookeeper',
                      description: 'Zookeeper cluster',
                      tags: [
                        'smt-all',
                        'smt-zookeeper',
                      ],
                    }),
                    new Network.Service({
                      id: 'smt-dev-mysql',
                      name: 'sec-smt-perconams-dev-mysql',
                      description: 'Shared MySQL server',
                      tags: [
                        'smt-all',
                        'smt-mysql',
                      ],
                    }),
                    new Network.Service({
                      id: 'smt-dev-dashboard-application',
                      description: 'Custom dashboard application',
                      tags: [
                        'smt-all',
                        'smt-dashboard',
                      ],
                    }),
                    new Network.Service({
                      id: 'smt-dev-elastic',
                      description: 'ElasticSearch cluster',
                      tags: [
                        'smt-all',
                        'smt-elastic',
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
}))

// Kubernetes Team
DATA.nodes.push(new Network.Owner({
  id: 'kube',
  name: 'Kube Team',
  unknown: true,
  childrens: [
    new Network.Project({
      id: 'company-kube-dev',
      childrens:[
        new Network.Net({
          id: 'kube-dev',
          parent: 'company-spn-dev',
          unknown: true,
          childrens:[
            new Network.Subnet({
              id: 'kube-dev-central1-01',
              cidr: '192.168.0.0/23',
              unknown: true,
              childrens:[
                new Network.Service({
                  id: 'kubernetes-shared',
                  url: 'https://kube-master.kube.company.com/',
                  unknown: true,
                  tags: [
                    'kubernetes-dev-app',
                    'kubernetes-dev-node',
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
}))

// Tools Team
DATA.nodes.push(new Network.Owner({
  id: 'tools',
  name: 'Tools Team',
  unknown: true,
  childrens: [
    new Network.Project({
      id: 'company-tools-com',
      childrens: [
        new Network.Net({
          id: 'tools-com',
          parent: 'company-spn-com',
          unknown: true,
          childrens: [
            new Network.Subnet({
              id: 'tools-com-central1-01',
              cidr: '192.168.0.0/23',
              unknown: true,
              childrens: [
                new Network.Service({
                  id: 'tools-github',
                  url: 'https://github.company.com:8443/',
                }),
                new Network.Service({
                  id: 'tools-nexus',
                  url: 'https://nexus.company.com:8443/',
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
}))

// Entry points
DATA.nodes.push(new Group({
  id: 'company-network',
  description: 'General Company network traffic source point',
  unknown: true,
  childrens: [
    new Network.Subnet({
      cidr: '10.16.0.0/12',
      name: 'Company VPN',
    }),
    new Network.Subnet({
      cidr: '10.55.100.0/23',
      name: 'SanFrancisco WiFi',
    }),
    new Network.Subnet({
      cidr: '10.11.48.0/24',
      name: 'Contractor VDI',
    }),
    new Network.Subnet({
      cidr: '172.101.0.0/20',
      name: 'Secondary WiFi',
    }),
  ],
}))

DATA.nodes.push(new Group({
  id: 'contractor-network',
  description: 'Contractor VPN traffic source point',
  unknown: true,
  childrens: [
    'Subnet:172.21.124.0/24'
  ],
}))

DATA.nodes.push(new Group({
  id: 'dc-network',
  description: 'Private datacenter traffic source point',
  unknown: true,
  childrens: [
    'Address:10.1.240.10',
    'Address:10.2.31.4',
    'Address:10.2.31.2',
    'Address:10.2.31.3',
    'Address:10.4.31.5',
    'Address:10.3.31.6',
    'Address:10.2.31.1',
  ],
}))

DATA.connectors.push(new Connector({
  sourceSelector: 'id:company-network',
  targetSelector: 'tag:smt-all',
  targetResource: 'tcp:22',
  description: 'Access from Company laptops, vpn, VDI to vpc by SSH',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'id:company-network',
  targetSelector: 'tag:smt-jenkins',
  targetResource: [
    'tcp:8443',
    'tcp:443',
  ],
  description: 'Management of Jenkins',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'tag:smt-kafka',
  targetSelector: 'tag:smt-kafka',
  targetResource: [
    'tcp:2181',
    'tcp:9082',
    'tcp:9084',
    'tcp:9999',
  ],
  description: 'Allow kafka to communiucate inside the cluster',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'tag:smt-dataproc',
  targetSelector: 'tag:smt-kafka',
  targetResource: [
    'tcp:2181',
    'tcp:9082',
    'tcp:9084',
    'tcp:9999',
  ],
  description: 'Allow dataproc to communiucate to kafka',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'tag:smt-dataproc',
  targetSelector: 'tag:smt-mysql',
  targetResource: 'tcp:3306',
  description: 'Access from dataproc to mysql',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: [
    'tag:paas-openshift-app',
    'tag:paas-openshift-node',
  ],
  targetSelector: 'tag:smt-jenkins',
  targetResource: [
    'tcp:443',
    'tcp:50000-50050',
  ],
  description: 'On-demand jenkins agents should be able to connect to the jenkins master',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'id:company-network',
  targetSelector: 'tag:smt-jenkins',
  targetResource: [
    'tcp:443',
    'tcp:8443',
  ],
  description: 'Management of jenkins',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'tag:smt-airflow',
  targetSelector: 'tag:smt-nifi',
  targetResource: [
    'tcp:2181',
    'tcp:8021',
    'tcp:8022',
    'tcp:8070',
    'tcp:8080',
    'tcp:9088',
    'tcp:9090',
    'tcp:9091',
    'tcp:9999',
    'tcp:10443',
  ],
  description: 'Allows Airflow to communicate to NiFi',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'id:company-network',
  targetSelector: [
    'tag:smt-airflow',
    'tag:smt-nifi',
  ],
  targetResource: [
    'tcp:8080',
    'tcp:443',
    'tcp:5000', // WTF?
  ],
  description: 'User access for the services NiFi & Airflow',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'tag:smt-airflow',
  targetSelector: 'tag:smt-mysql',
  targetResource: 'tcp:3306',
  description: 'Airflow database access',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'tag:smt-airflow',
  targetSelector: 'tag:smt-airflow',
  targetResource: [
    'tcp:443',
    'tcp:5673',
  ],
  description: 'Airflow internal access',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'tag:smt-dataproc',
  targetSelector: 'tag:smt-dataproc',
  targetResource: [
    'tcp:111',
    'tcp:2181',
    'tcp:2888',
    'tcp:3306',
    'tcp:3888',
    'tcp:7337',
    'tcp:7891',
    'tcp:7899',
    'tcp:8019-8020',
    'tcp:8030-8033',
    'tcp:8040',
    'tcp:8042',
    'tcp:8088',
    'tcp:8443',
    'tcp:8480',
    'tcp:8485',
    'tcp:8551',
    'tcp:8553',
    'tcp:8554',
    'tcp:9083',
    'tcp:9600',
    'tcp:9864',
    'tcp:9866',
    'tcp:9867',
    'tcp:9870',
    'tcp:10000',
    'tcp:10001',
    'tcp:10020',
    'tcp:10033',
    'tcp:13338',
    'tcp:13562',
    'tcp:18080',
    'tcp:19888',
    'tcp:24231',
    'tcp:32768-61000',
  ],
  description: 'Dataproc cluster interconnection',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'tag:smt-jenkins',
  targetSelector: [
    'tag:smt-airflow',
    'tag:smt-nifi',
  ],
  targetResource: [
    'tcp:443',
  ],
  description: 'Jenkins ability to talk with airflow & nifi API',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: [
    'tag:paas-openshift-app',
    'tag:paas-openshift-node',
  ],
  targetSelector: 'tag:smt-jenkins',
  targetResource: [
    'tcp:22',
  ],
  description: 'Allow Jenkins dynamic agents to deploy new Jenkins instance',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'tag:smt-elastic-interconnect',
  targetSelector: 'tag:smt-elastic-interconnect',
  targetResource: [
    'tcp:9300-9400',
  ],
  description: 'Elastic cluster interconnection',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({ // Duplicate of connector will be merged
  sourceSelector: 'tag:smt-airflow',
  targetSelector: 'tag:smt-nifi',
  targetResource: [
    'tcp:6342',
    'tcp:9443',
    'tcp:10443',
  ],
  description: 'Allows Airflow to communicate to NiFi',
  owner: 'smp_devops@company.com',
}))
DATA.connectors.push(new Connector({ // Duplicate of connector will be merged
  sourceSelector: 'tag:smt-nifi',
  targetSelector: 'tag:smt-nifi',
  targetResource: [
    'tcp:8080', // ???
    'tcp:8081', // ???
    'tcp:9001', // ???
    'udp:8080', // ???
    'udp:8081', // ???
    'udp:9001', // ???
  ],
  description: 'To lt LB communicate with nifi',
  owner: 'smt_devops@company.com',
}))
DATA.connectors.push(new Connector({
  sourceSelector: 'id:onprem-network',
  targetSelector: 'tag:smt-nifi',
  targetResource: [
    'tcp:2181', // ???
    'tcp:8080', // ???
    'tcp:8081', // ???
    'tcp:8082', // ???
    'tcp:9091', // ???
    'tcp:60000', // ???
    'udp:2181', // ???
    'udp:8080', // ???
    'udp:8081', // ???
    'udp:8082', // ???
    'udp:9091', // ???
    'udp:60001', // ???
  ],
  description: 'Forward syslog messages from Input to Super Mega Project LB',
  owner: 'smt_devops@company.com',
}))

DATA.connectors.push(new Connector({
  sourceSelector: 'id:contractor-network',
  targetSelector: 'tag:smt-kafka',
  targetResource: [
    'tcp:9094', // ???
  ],
  description: 'Network access to Contractor consultants for Kafka and Zookeeper',
  owner: 'smp_devops@company.com',
  approved: false,
  active: false,
}))
