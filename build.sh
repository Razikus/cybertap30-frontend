TAG=1.3
docker build -t registry.gitlab.com/razniewski/cybertap-registry/front:$TAG .
docker push registry.gitlab.com/razniewski/cybertap-registry/front:$TAG
